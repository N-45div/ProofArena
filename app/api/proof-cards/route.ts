import { NextResponse } from "next/server";
import { createSignedProofCard, proofCardInputSchema } from "@/lib/proofarena/proof-card";
import { saveProofCard } from "@/lib/proofarena/proof-store";

export async function POST(request: Request) {
  const body = await request.json();
  const input = proofCardInputSchema.parse(body);
  const card = await saveProofCard(createSignedProofCard(input));

  return NextResponse.json({
    card,
    proofUrl: `/proof/${card.id}`,
  });
}
