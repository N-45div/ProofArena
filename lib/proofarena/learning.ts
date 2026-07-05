import type { ScoreCard } from "./evaluator";

export const VERIFIER_VERSION = "proofarena-verifier-v0.2";

export type LearningEvent = {
  readonly aspName: string;
  readonly category: string;
  readonly taskHash: string;
  readonly deliveryHash: string;
  readonly verifierVersion: string;
  readonly verdict: ScoreCard["verdict"];
  readonly score: number;
  readonly buyerOutcome?: "approved" | "revision_requested" | "rejected" | "disputed";
  readonly disputeOutcome?: "asp_won" | "buyer_won" | "settled";
  readonly lessons: readonly string[];
};

export type AspMemoryProfile = {
  readonly aspName: string;
  readonly totalVerified: number;
  readonly averageScore: number;
  readonly approvalRate: number;
  readonly revisionRate: number;
  readonly commonRisks: readonly string[];
  readonly categoryScores: readonly { readonly category: string; readonly averageScore: number; readonly count: number }[];
};

export function buildLearningEvent(input: {
  readonly scorecard: ScoreCard;
  readonly category: string;
  readonly taskHash: string;
  readonly deliveryHash: string;
  readonly risks: readonly string[];
  readonly buyerOutcome?: LearningEvent["buyerOutcome"];
  readonly disputeOutcome?: LearningEvent["disputeOutcome"];
}): LearningEvent {
  return {
    aspName: input.scorecard.aspName,
    category: input.category,
    taskHash: input.taskHash,
    deliveryHash: input.deliveryHash,
    verifierVersion: VERIFIER_VERSION,
    verdict: input.scorecard.verdict,
    score: input.scorecard.score,
    buyerOutcome: input.buyerOutcome,
    disputeOutcome: input.disputeOutcome,
    lessons: inferLessons(input.scorecard, input.risks),
  };
}

export function summarizeAspMemory(aspName: string, events: readonly LearningEvent[]): AspMemoryProfile {
  const relevant = events.filter((event) => event.aspName.toLowerCase() === aspName.toLowerCase());
  const totalVerified = relevant.length;
  const averageScore = totalVerified
    ? Math.round(relevant.reduce((sum, event) => sum + event.score, 0) / totalVerified)
    : 0;
  const approvals = relevant.filter((event) => event.buyerOutcome === "approved").length;
  const revisions = relevant.filter((event) => event.buyerOutcome === "revision_requested").length;
  const riskCounts = new Map<string, number>();
  for (const event of relevant) {
    for (const lesson of event.lessons) {
      riskCounts.set(lesson, (riskCounts.get(lesson) || 0) + 1);
    }
  }

  return {
    aspName,
    totalVerified,
    averageScore,
    approvalRate: totalVerified ? roundPct(approvals / totalVerified) : 0,
    revisionRate: totalVerified ? roundPct(revisions / totalVerified) : 0,
    commonRisks: Array.from(riskCounts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5)
      .map(([risk]) => risk),
    categoryScores: summarizeCategories(relevant),
  };
}

function inferLessons(scorecard: ScoreCard, risks: readonly string[]) {
  const lessons = new Set<string>(risks);
  if (scorecard.score < 70) lessons.add("low proof score");
  if (scorecard.verdict === "revise") lessons.add("revision likely before escrow release");
  if (scorecard.verdict === "reject") lessons.add("high rejection risk");
  return Array.from(lessons);
}

function summarizeCategories(events: readonly LearningEvent[]) {
  const byCategory = new Map<string, LearningEvent[]>();
  for (const event of events) {
    byCategory.set(event.category, [...(byCategory.get(event.category) || []), event]);
  }
  return Array.from(byCategory.entries()).map(([category, categoryEvents]) => ({
    category,
    count: categoryEvents.length,
    averageScore: Math.round(
      categoryEvents.reduce((sum, event) => sum + event.score, 0) / categoryEvents.length,
    ),
  }));
}

function roundPct(value: number) {
  return Math.round(value * 100);
}
