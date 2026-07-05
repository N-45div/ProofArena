import { defineTool } from "eve/tools";
import { generateProofPack, arenaSchema } from "@/lib/proofarena/evaluator";

export default defineTool({
  description: "Generate a buyer-facing proof pack and escrow recommendation for an arena.",
  inputSchema: arenaSchema,
  async execute(input) {
    return generateProofPack(input);
  },
});
