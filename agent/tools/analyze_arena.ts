import { defineTool } from "eve/tools";
import { evaluateArena, arenaSchema } from "@/lib/proofarena/evaluator";

export default defineTool({
  description: "Rank all ASP submissions in an arena and detect close races.",
  inputSchema: arenaSchema,
  async execute(input) {
    return evaluateArena(input);
  },
});
