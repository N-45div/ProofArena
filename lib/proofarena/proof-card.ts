import { createHash, createHmac, randomUUID } from "node:crypto";
import { z } from "zod";
import { extractDealFromConversation } from "./deal-parser.ts";
import { scoreSubmission, type CheckResult, type ProofSubmission, type ScoreCard } from "./evaluator.ts";
import { VERIFIER_VERSION } from "./learning.ts";
import { verifySoftwareArtifacts } from "./software-artifacts.ts";

export const proofCardInputSchema = z.object({
  aspName: z.string().min(1),
  taskText: z.string().min(1),
  deliveryText: z.string().min(1),
  artifacts: z.array(z.string()).default([]),
  sources: z.array(z.string()).default([]),
});

export const signedProofCardSchema = z.object({
  id: z.string(),
  aspName: z.string(),
  category: z.string(),
  verdict: z.enum(["approve", "revise", "reject"]),
  score: z.number(),
  taskHash: z.string(),
  deliveryHash: z.string(),
  artifactHashes: z.array(z.object({ artifact: z.string(), hash: z.string() })),
  sourceHashes: z.array(z.object({ source: z.string(), hash: z.string() })),
  verifierVersion: z.string(),
  issuedAt: z.string(),
  signatureAlgorithm: z.literal("HMAC-SHA256"),
  signature: z.string(),
  acceptanceCriteria: z.array(z.string()),
  checks: z.array(
    z.object({
      label: z.string(),
      passed: z.boolean(),
      score: z.number(),
      evidence: z.string(),
    }),
  ),
  risks: z.array(z.string()),
  softwareEvidence: z
    .object({
      repoUrls: z.array(z.string()),
      deploymentUrls: z.array(z.string()),
      packageEvidence: z.array(z.string()),
      testEvidence: z.array(z.string()),
      buildEvidence: z.array(z.string()),
    })
    .optional(),
  buyerMessage: z.string(),
});

export type ProofCardInput = z.infer<typeof proofCardInputSchema>;
export type SignedProofCard = z.infer<typeof signedProofCardSchema>;

export async function createSignedProofCard(input: ProofCardInput): Promise<SignedProofCard> {
  const parsed = proofCardInputSchema.parse(input);
  const deal = extractDealFromConversation({
    conversation: parsed.taskText,
    delivery: parsed.deliveryText,
  });
  const submission: ProofSubmission = {
    id: `sub-${hashText(`${parsed.aspName}:${deal.deliveryHash}`).slice(0, 12)}`,
    aspName: parsed.aspName,
    category: deal.category,
    title: deal.buyerAsk,
    summary: parsed.deliveryText,
    sources: parsed.sources,
    artifacts: [...parsed.artifacts, ...deal.deliveredArtifacts],
    claims: [parsed.deliveryText],
    submittedAt: new Date().toISOString(),
  };
  const scorecard = scoreSubmission(submission, deal.acceptanceCriteria);
  const enriched = await enrichScorecard({
    scorecard,
    category: deal.category,
    taskText: parsed.taskText,
    deliveryText: parsed.deliveryText,
    artifacts: submission.artifacts,
    sources: submission.sources,
  });
  const unsigned = {
    id: `proof-${randomUUID()}`,
    aspName: parsed.aspName,
    category: deal.category,
    verdict: enriched.scorecard.verdict,
    score: enriched.scorecard.score,
    taskHash: deal.taskHash,
    deliveryHash: deal.deliveryHash,
    artifactHashes: hashArtifacts(submission.artifacts),
    sourceHashes: hashSources(submission.sources),
    verifierVersion: VERIFIER_VERSION,
    issuedAt: new Date().toISOString(),
    signatureAlgorithm: "HMAC-SHA256" as const,
    acceptanceCriteria: deal.acceptanceCriteria,
    checks: [...enriched.scorecard.checks],
    risks: [...enriched.scorecard.risks],
    softwareEvidence: enriched.softwareEvidence,
    buyerMessage: buildBuyerMessage(enriched.scorecard),
  };
  return {
    ...unsigned,
    signature: signProofPayload(unsigned),
  };
}

async function enrichScorecard(input: {
  readonly scorecard: ScoreCard;
  readonly category: string;
  readonly taskText: string;
  readonly deliveryText: string;
  readonly artifacts: readonly string[];
  readonly sources: readonly string[];
}): Promise<{
  readonly scorecard: ScoreCard;
  readonly softwareEvidence?: SignedProofCard["softwareEvidence"];
}> {
  if (input.category !== "software") return { scorecard: input.scorecard };

  const softwareReport = await verifySoftwareArtifacts({
    taskText: input.taskText,
    deliveryText: input.deliveryText,
    artifacts: input.artifacts,
    sources: input.sources,
  });
  const checks = [...input.scorecard.checks, ...softwareReport.checks];
  const risks = Array.from(new Set([...input.scorecard.risks, ...softwareReport.risks]));
  const score = Math.round(checks.reduce((total, check) => total + check.score, 0) / checks.length);
  const verdict = score >= 82 && risks.length <= 1 ? "approve" : score >= 58 ? "revise" : "reject";

  return {
    scorecard: {
      ...input.scorecard,
      score,
      verdict,
      checks,
      risks,
    },
    softwareEvidence: {
      repoUrls: [...softwareReport.evidence.repoUrls],
      deploymentUrls: [...softwareReport.evidence.deploymentUrls],
      packageEvidence: [...softwareReport.evidence.packageEvidence],
      testEvidence: [...softwareReport.evidence.testEvidence],
      buildEvidence: [...softwareReport.evidence.buildEvidence],
    },
  };
}

export function verifyProofCard(card: SignedProofCard) {
  const { signature, ...unsigned } = signedProofCardSchema.parse(card);
  return signature === signProofPayload(unsigned);
}

export function hashText(value: string) {
  return createHash("sha256").update(value.trim()).digest("hex");
}

function hashArtifacts(values: readonly string[]) {
  return uniqueClean(values).map((artifact) => ({
    artifact,
    hash: hashText(artifact),
  }));
}

function hashSources(values: readonly string[]) {
  return uniqueClean(values).map((source) => ({
    source,
    hash: hashText(source),
  }));
}

function uniqueClean(values: readonly string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function signProofPayload(payload: object) {
  const secret = process.env.PROOFARENA_SIGNING_SECRET || "proofarena-local-dev-signing-key";
  return createHmac("sha256", secret).update(stableStringify(payload)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function buildBuyerMessage(scorecard: ScoreCard) {
  if (scorecard.verdict === "approve") {
    return `ProofArena verified ${scorecard.aspName} with score ${scorecard.score}. Evidence checks passed and escrow release is recommended.`;
  }
  if (scorecard.verdict === "revise") {
    return `ProofArena recommends revision before escrow release. ${scorecard.aspName} should address: ${scorecard.risks.join(", ") || "the failed checks"}.`;
  }
  return `ProofArena recommends rejecting or escalating this delivery. ${scorecard.aspName} did not provide enough proof for escrow release.`;
}
