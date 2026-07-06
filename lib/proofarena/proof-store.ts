import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../prisma.ts";
import { signedProofCardSchema, type SignedProofCard } from "./proof-card.ts";

const proofStoreDir = path.join(process.cwd(), ".proofarena", "proof-cards");

export async function saveProofCard(card: SignedProofCard) {
  if (process.env.DATABASE_URL) {
    await prisma.proofCard.upsert({
      where: { id: card.id },
      update: toProofCardRecord(card),
      create: {
        id: card.id,
        ...toProofCardRecord(card),
      },
    });
    return card;
  }

  await mkdir(proofStoreDir, { recursive: true });
  await writeFile(proofPath(card.id), JSON.stringify(card, null, 2));
  return card;
}

export async function readProofCard(id: string) {
  if (process.env.DATABASE_URL) {
    const record = await prisma.proofCard.findUnique({ where: { id } });
    if (!record) {
      throw new Error(`Proof card not found: ${id}`);
    }
    return signedProofCardSchema.parse({
      id: record.id,
      aspName: record.aspName,
      category: record.category,
      verdict: record.verdict,
      score: record.score,
      taskHash: record.taskHash,
      deliveryHash: record.deliveryHash,
      artifactHashes: JSON.parse(record.artifactHashesJson),
      sourceHashes: JSON.parse(record.sourceHashesJson),
      verifierVersion: record.verifierVersion,
      issuedAt: record.issuedAt.toISOString(),
      signatureAlgorithm: record.signatureAlgorithm,
      signature: record.signature,
      acceptanceCriteria: JSON.parse(record.acceptanceCriteria),
      checks: JSON.parse(record.checksJson),
      risks: JSON.parse(record.risksJson),
      buyerMessage: record.buyerMessage,
    });
  }

  const data = await readFile(proofPath(id), "utf8");
  return signedProofCardSchema.parse(JSON.parse(data));
}

function proofPath(id: string) {
  return path.join(proofStoreDir, `${id}.json`);
}

function toProofCardRecord(card: SignedProofCard) {
  return {
    aspName: card.aspName,
    category: card.category,
    score: card.score,
    verdict: card.verdict,
    taskHash: card.taskHash,
    deliveryHash: card.deliveryHash,
    artifactHashesJson: JSON.stringify(card.artifactHashes),
    sourceHashesJson: JSON.stringify(card.sourceHashes),
    verifierVersion: card.verifierVersion,
    issuedAt: new Date(card.issuedAt),
    signatureAlgorithm: card.signatureAlgorithm,
    signature: card.signature,
    acceptanceCriteria: JSON.stringify(card.acceptanceCriteria),
    checksJson: JSON.stringify(card.checks),
    risksJson: JSON.stringify(card.risks),
    buyerMessage: card.buyerMessage,
    proofPackJson: JSON.stringify(card),
  };
}
