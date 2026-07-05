import { z } from "zod";

export const submissionSchema = z.object({
  id: z.string(),
  aspName: z.string(),
  category: z.enum(["finance", "software", "onchain", "art", "lifestyle", "listing"]),
  title: z.string(),
  summary: z.string(),
  sources: z.array(z.string()).default([]),
  artifacts: z.array(z.string()).default([]),
  claims: z.array(z.string()).default([]),
  submittedAt: z.string(),
});

export const arenaSchema = z.object({
  id: z.string(),
  title: z.string(),
  buyer: z.string(),
  category: submissionSchema.shape.category,
  acceptanceCriteria: z.array(z.string()),
  submissions: z.array(submissionSchema),
});

export type ProofSubmission = z.infer<typeof submissionSchema>;
export type ProofArena = z.infer<typeof arenaSchema>;

export type CheckResult = {
  readonly label: string;
  readonly passed: boolean;
  readonly score: number;
  readonly evidence: string;
};

export type ScoreCard = {
  readonly submissionId: string;
  readonly aspName: string;
  readonly score: number;
  readonly verdict: "approve" | "revise" | "reject";
  readonly checks: readonly CheckResult[];
  readonly risks: readonly string[];
};

export type ArenaResult = {
  readonly arenaId: string;
  readonly winner: ScoreCard;
  readonly scorecards: readonly ScoreCard[];
  readonly closeRace: boolean;
};

export function scoreSubmission(
  submission: ProofSubmission,
  acceptanceCriteria: readonly string[],
): ScoreCard {
  const checks: CheckResult[] = [
    scoreSources(submission),
    scoreArtifacts(submission),
    scoreClaims(submission),
    scoreCriteriaCoverage(submission, acceptanceCriteria),
    scoreCategoryFit(submission),
  ];
  const score = Math.round(
    checks.reduce((total, check) => total + check.score, 0) / checks.length,
  );
  const risks = collectRisks(submission, checks);
  const verdict = score >= 82 && risks.length <= 1 ? "approve" : score >= 58 ? "revise" : "reject";

  return {
    submissionId: submission.id,
    aspName: submission.aspName,
    score,
    verdict,
    checks,
    risks,
  };
}

export function evaluateArena(arena: ProofArena): ArenaResult {
  const parsedArena = arenaSchema.parse(arena);
  const scorecards = parsedArena.submissions
    .map((submission) => scoreSubmission(submission, parsedArena.acceptanceCriteria))
    .sort((left, right) => right.score - left.score);
  const [winner, runnerUp] = scorecards;

  if (!winner) {
    throw new Error("Arena requires at least one submission.");
  }

  return {
    arenaId: parsedArena.id,
    winner,
    scorecards,
    closeRace: runnerUp ? winner.score - runnerUp.score < 8 : false,
  };
}

export function generateProofPack(arena: ProofArena, result = evaluateArena(arena)) {
  return {
    arenaId: arena.id,
    title: arena.title,
    recommendation: result.closeRace ? "send_to_evaluator_vote" : result.winner.verdict,
    winner: result.winner.aspName,
    releaseEscrow: result.winner.verdict === "approve" && !result.closeRace,
    evidenceSummary: result.winner.checks.map((check) => ({
      check: check.label,
      passed: check.passed,
      evidence: check.evidence,
    })),
    risks: result.winner.risks,
    evaluatorNote: result.closeRace
      ? "Top submissions are within 8 points. Ask evaluators to break the tie before release."
      : "Automated verifier confidence is high enough for a buyer recommendation.",
  };
}

function scoreSources(submission: ProofSubmission): CheckResult {
  const validSources = submission.sources.filter((source) => /^https?:\/\//.test(source));
  const score = validSources.length >= 3 ? 95 : validSources.length >= 1 ? 68 : 20;
  return {
    label: "Source evidence",
    passed: score >= 68,
    score,
    evidence: `${validSources.length}/${submission.sources.length} submitted sources are URL-backed.`,
  };
}

function scoreArtifacts(submission: ProofSubmission): CheckResult {
  const hasArtifact = submission.artifacts.length > 0;
  const hasMachineReadable = submission.artifacts.some((artifact) =>
    /\.(json|csv|md|txt|log|zip|png|jpg|jpeg|pdf)$/i.test(artifact),
  );
  const score = hasMachineReadable ? 92 : hasArtifact ? 70 : 35;
  return {
    label: "Deliverable artifacts",
    passed: score >= 70,
    score,
    evidence: hasArtifact
      ? `${submission.artifacts.length} artifact(s) supplied.`
      : "No artifact was supplied.",
  };
}

function scoreClaims(submission: ProofSubmission): CheckResult {
  const unsupported = submission.claims.filter((claim) =>
    /\b(always|guaranteed|risk-free|certain|100%)\b/i.test(claim),
  );
  const score = unsupported.length === 0 ? 88 : unsupported.length === 1 ? 61 : 32;
  return {
    label: "Unsupported claim risk",
    passed: score >= 61,
    score,
    evidence:
      unsupported.length === 0
        ? "No absolute or guaranteed claims detected."
        : `${unsupported.length} risky absolute claim(s) detected.`,
  };
}

function scoreCriteriaCoverage(
  submission: ProofSubmission,
  acceptanceCriteria: readonly string[],
): CheckResult {
  const haystack = `${submission.title} ${submission.summary} ${submission.claims.join(" ")}`.toLowerCase();
  const covered = acceptanceCriteria.filter((criterion) =>
    criterion
      .toLowerCase()
      .split(/\W+/)
      .filter((part) => part.length > 4)
      .some((keyword) => haystack.includes(keyword)),
  );
  const ratio = acceptanceCriteria.length ? covered.length / acceptanceCriteria.length : 1;
  const score = Math.round(45 + ratio * 50);
  return {
    label: "Acceptance coverage",
    passed: ratio >= 0.66,
    score,
    evidence: `${covered.length}/${acceptanceCriteria.length} acceptance criteria are reflected in the delivery.`,
  };
}

function scoreCategoryFit(submission: ProofSubmission): CheckResult {
  const categoryKeywords: Record<ProofSubmission["category"], string[]> = {
    finance: ["source", "risk", "market", "data", "timestamp"],
    software: ["test", "repo", "endpoint", "install", "log"],
    onchain: ["tx", "address", "contract", "explorer", "chain"],
    art: ["image", "asset", "resolution", "style", "prompt"],
    lifestyle: ["plan", "preference", "constraint", "schedule", "recipe"],
    listing: ["pricing", "demo", "category", "service", "review"],
  };
  const text = `${submission.summary} ${submission.claims.join(" ")}`.toLowerCase();
  const hits = categoryKeywords[submission.category].filter((keyword) => text.includes(keyword));
  const score = hits.length >= 3 ? 90 : hits.length >= 1 ? 67 : 42;
  return {
    label: "Category fit",
    passed: score >= 67,
    score,
    evidence: `${hits.length} category-specific signal(s) found for ${submission.category}.`,
  };
}

function collectRisks(submission: ProofSubmission, checks: readonly CheckResult[]) {
  const risks = checks.filter((check) => !check.passed).map((check) => check.label);
  const text = `${submission.title} ${submission.summary} ${submission.claims.join(" ")}`.toLowerCase();

  if (
    submission.category === "software" &&
    /\b(no|missing|without|did not include|coming later)\b.{0,48}\b(deploy|deployment|deployed url|endpoint)\b/.test(text)
  ) {
    risks.push("Missing deployment proof");
  }
  if (
    submission.category === "software" &&
    /\b(no|missing|without|did not include|coming later)\b.{0,48}\b(test|tests|test log|logs)\b/.test(text)
  ) {
    risks.push("Missing test evidence");
  }
  if (
    submission.category === "onchain" &&
    /\b(no|missing|without)\b.{0,48}\b(tx|hash|explorer|address)\b/.test(text)
  ) {
    risks.push("Missing onchain proof");
  }

  if (submission.sources.length === 0) {
    risks.push("No external evidence supplied");
  }
  if (submission.summary.length < 160) {
    risks.push("Delivery summary is thin");
  }
  return risks;
}
