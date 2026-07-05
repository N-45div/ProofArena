import { createHash } from "node:crypto";
import { z } from "zod";

export const extractedDealSchema = z.object({
  buyerAsk: z.string(),
  aspPromise: z.array(z.string()),
  acceptanceCriteria: z.array(z.string()),
  deliveredArtifacts: z.array(z.string()),
  missingEvidence: z.array(z.string()),
  category: z.enum(["finance", "software", "onchain", "art", "lifestyle", "listing"]),
  taskHash: z.string(),
  deliveryHash: z.string(),
});

export type ExtractedDeal = z.infer<typeof extractedDealSchema>;

const CATEGORY_SIGNALS: Record<ExtractedDeal["category"], readonly string[]> = {
  finance: ["btc", "market", "risk", "treasury", "ticker", "funding", "price"],
  software: ["repo", "github", "deploy", "endpoint", "test", "build", "next.js", "api"],
  onchain: ["tx", "hash", "contract", "wallet", "address", "chain", "explorer"],
  art: ["logo", "image", "banner", "style", "asset", "resolution", "prompt"],
  lifestyle: ["meal", "travel", "fitness", "schedule", "recipe", "plan"],
  listing: ["asp", "okx.ai", "listing", "pricing", "demo", "category"],
};

export function extractDealFromConversation(input: {
  readonly conversation: string;
  readonly delivery?: string;
}): ExtractedDeal {
  const conversation = normalize(input.conversation);
  const delivery = normalize(input.delivery || inferDelivery(conversation));
  const category = inferCategory(`${conversation}\n${delivery}`);
  const buyerAsk = inferBuyerAsk(conversation);
  const aspPromise = inferPromises(conversation);
  const acceptanceCriteria = inferAcceptanceCriteria(conversation, category);
  const deliveredArtifacts = inferArtifacts(delivery);
  const missingEvidence = inferMissingEvidence(acceptanceCriteria, deliveredArtifacts, delivery);

  return {
    buyerAsk,
    aspPromise,
    acceptanceCriteria,
    deliveredArtifacts,
    missingEvidence,
    category,
    taskHash: hashText(buyerAsk),
    deliveryHash: hashText(delivery),
  };
}

export function hashText(value: string) {
  return createHash("sha256").update(value.trim()).digest("hex");
}

function normalize(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

function inferDelivery(conversation: string) {
  const markers = ["delivery:", "delivered:", "final:", "asp response:", "agent response:"];
  const lower = conversation.toLowerCase();
  for (const marker of markers) {
    const index = lower.lastIndexOf(marker);
    if (index >= 0) return conversation.slice(index + marker.length);
  }
  return conversation.split(/\n{2,}/).at(-1) || conversation;
}

function inferCategory(text: string): ExtractedDeal["category"] {
  const lower = text.toLowerCase();
  const scored = Object.entries(CATEGORY_SIGNALS).map(([category, signals]) => ({
    category: category as ExtractedDeal["category"],
    hits: signals.filter((signal) => lower.includes(signal)).length,
  }));
  scored.sort((left, right) => right.hits - left.hits);
  return scored[0]?.hits ? scored[0].category : "software";
}

function inferBuyerAsk(conversation: string) {
  const lines = conversation
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const taskLine = lines.find((line) => /^(task|buyer|request|asked|i need|need|build|create):?/i.test(line));
  return taskLine || lines[0] || conversation.slice(0, 240);
}

function inferPromises(conversation: string) {
  const lines = conversation
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /\b(will|promise|include|deliver|provide|ship|build|deploy|attach)\b/i.test(line));
  return unique(lines).slice(0, 8);
}

function inferAcceptanceCriteria(conversation: string, category: ExtractedDeal["category"]) {
  const criteria = conversation
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter((line) => /\b(required|must|include|accept|criteria|deliver|provide|with)\b/i.test(line));

  const defaults: Record<ExtractedDeal["category"], string[]> = {
    finance: ["fresh sources", "risk language", "no guaranteed advice", "scenario coverage"],
    software: ["repo or source artifact", "build/test evidence", "deployed URL or run logs", "acceptance criteria coverage"],
    onchain: ["chain and tx hash", "address/value confirmation", "explorer evidence", "recipient match"],
    art: ["requested format", "dimensions", "style adherence", "usable asset file"],
    lifestyle: ["constraints respected", "clear plan", "preferences covered", "actionable next steps"],
    listing: ["service description", "pricing", "category fit", "demo readiness"],
  };

  return unique([...criteria, ...defaults[category]]).slice(0, 10);
}

function inferArtifacts(delivery: string) {
  const artifactMatches = delivery.match(/https?:\/\/\S+|[\w.-]+\.(json|csv|md|txt|log|zip|png|jpg|jpeg|pdf)|github\.com\/\S+/gi);
  return unique(artifactMatches || []);
}

function inferMissingEvidence(
  acceptanceCriteria: readonly string[],
  artifacts: readonly string[],
  delivery: string,
) {
  const lowerDelivery = delivery.toLowerCase();
  const joinedArtifacts = artifacts.join(" ").toLowerCase();
  const missing = acceptanceCriteria.filter((criterion) => {
    const keywords = criterion.toLowerCase().split(/\W+/).filter((word) => word.length > 4);
    return !keywords.some((keyword) => lowerDelivery.includes(keyword) || joinedArtifacts.includes(keyword));
  });
  return missing.slice(0, 8);
}

function unique(values: readonly string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}
