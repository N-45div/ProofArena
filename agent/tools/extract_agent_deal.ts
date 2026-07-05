import { defineTool } from "eve/tools";
import { z } from "zod";
import { extractDealFromConversation } from "@/lib/proofarena/deal-parser";

export default defineTool({
  description:
    "Extract the buyer ask, ASP promises, acceptance criteria, artifacts, and hashes from a messy OKX.AI task conversation.",
  inputSchema: z.object({
    conversation: z.string(),
    delivery: z.string().optional(),
  }),
  async execute(input) {
    return extractDealFromConversation(input);
  },
});
