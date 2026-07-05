import { defineTool } from "eve/tools";
import { createSignedProofCard, proofCardInputSchema } from "@/lib/proofarena/proof-card";
import { saveProofCard } from "@/lib/proofarena/proof-store";

export default defineTool({
  description:
    "Create a signed, timestamped ProofArena proof card for an OKX.AI ASP delivery and return its local proof URL.",
  inputSchema: proofCardInputSchema,
  async execute(input) {
    const card = await saveProofCard(createSignedProofCard(input));
    return {
      card,
      proofUrl: `/proof/${card.id}`,
    };
  },
});
