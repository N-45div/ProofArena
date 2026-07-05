import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { signedProofCardSchema, type SignedProofCard } from "./proof-card";

const proofStoreDir = path.join(process.cwd(), ".proofarena", "proof-cards");

export async function saveProofCard(card: SignedProofCard) {
  await mkdir(proofStoreDir, { recursive: true });
  await writeFile(proofPath(card.id), JSON.stringify(card, null, 2));
  return card;
}

export async function readProofCard(id: string) {
  const data = await readFile(proofPath(id), "utf8");
  return signedProofCardSchema.parse(JSON.parse(data));
}

function proofPath(id: string) {
  return path.join(proofStoreDir, `${id}.json`);
}
