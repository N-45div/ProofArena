import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
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
    return signedProofCardSchema.parse(JSON.parse(record.proofPackJson));
  }

  const data = await readFile(proofPath(id), "utf8");
  return signedProofCardSchema.parse(JSON.parse(data));
}

export async function listProofCardsForAsp(aspName: string) {
  if (process.env.DATABASE_URL) {
    const records = await prisma.proofCard.findMany({
      where: {
        aspName: {
          equals: aspName,
        },
      },
      orderBy: {
        issuedAt: "desc",
      },
    });
    return records.map((record) => signedProofCardSchema.parse(JSON.parse(record.proofPackJson)));
  }

  const cards = await readLocalProofCards();
  return cards
    .filter((card) => card.aspName.toLowerCase() === aspName.toLowerCase())
    .sort((left, right) => new Date(right.issuedAt).getTime() - new Date(left.issuedAt).getTime());
}

export async function listRecentProofCards(limit = 20) {
  if (process.env.DATABASE_URL) {
    const records = await prisma.proofCard.findMany({
      orderBy: {
        issuedAt: "desc",
      },
      take: limit,
    });
    return records.map((record) => signedProofCardSchema.parse(JSON.parse(record.proofPackJson)));
  }

  const cards = await readLocalProofCards();
  return cards
    .sort((left, right) => new Date(right.issuedAt).getTime() - new Date(left.issuedAt).getTime())
    .slice(0, limit);
}

function proofPath(id: string) {
  return path.join(proofStoreDir, `${id}.json`);
}

async function readLocalProofCards() {
  try {
    const filenames = await readdir(proofStoreDir);
    const cards = await Promise.all(
      filenames
        .filter((filename) => filename.endsWith(".json"))
        .map(async (filename) => {
          const data = await readFile(path.join(proofStoreDir, filename), "utf8");
          return signedProofCardSchema.parse(JSON.parse(data));
        }),
    );
    return cards;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
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
