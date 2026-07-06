import { listProofCardsForAsp } from "./proof-store.ts";
import type { SignedProofCard } from "./proof-card.ts";

export type AspProofProfile = {
  readonly aspName: string;
  readonly totalCards: number;
  readonly averageScore: number;
  readonly approvalRate: number;
  readonly revisionRate: number;
  readonly rejectionRate: number;
  readonly categories: readonly { readonly category: string; readonly count: number; readonly averageScore: number }[];
  readonly commonRisks: readonly { readonly risk: string; readonly count: number }[];
  readonly recentCards: readonly SignedProofCard[];
};

export async function getAspProofProfile(aspName: string): Promise<AspProofProfile> {
  const cards = await listProofCardsForAsp(aspName);
  return getAspProofProfileFromCards(aspName, cards);
}

export function getAspProofProfileFromCards(
  aspName: string,
  cards: readonly SignedProofCard[],
): AspProofProfile {
  const totalCards = cards.length;
  const averageScore = totalCards
    ? Math.round(cards.reduce((total, card) => total + card.score, 0) / totalCards)
    : 0;

  return {
    aspName,
    totalCards,
    averageScore,
    approvalRate: rate(cards, "approve"),
    revisionRate: rate(cards, "revise"),
    rejectionRate: rate(cards, "reject"),
    categories: summarizeCategories(cards),
    commonRisks: summarizeRisks(cards),
    recentCards: cards.slice(0, 12),
  };
}

function rate(cards: readonly SignedProofCard[], verdict: SignedProofCard["verdict"]) {
  if (cards.length === 0) return 0;
  return Math.round((cards.filter((card) => card.verdict === verdict).length / cards.length) * 100);
}

function summarizeCategories(cards: readonly SignedProofCard[]) {
  const grouped = new Map<string, SignedProofCard[]>();
  for (const card of cards) {
    grouped.set(card.category, [...(grouped.get(card.category) || []), card]);
  }
  return Array.from(grouped.entries())
    .map(([category, categoryCards]) => ({
      category,
      count: categoryCards.length,
      averageScore: Math.round(
        categoryCards.reduce((total, card) => total + card.score, 0) / categoryCards.length,
      ),
    }))
    .sort((left, right) => right.count - left.count);
}

function summarizeRisks(cards: readonly SignedProofCard[]) {
  const counts = new Map<string, number>();
  for (const card of cards) {
    for (const risk of card.risks) {
      counts.set(risk, (counts.get(risk) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([risk, count]) => ({ risk, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 8);
}
