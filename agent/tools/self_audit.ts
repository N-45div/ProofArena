import { defineTool } from "eve/tools";
import { z } from "zod";
import { proofArenaMemory } from "../lib/session-memory";

export default defineTool({
  description:
    "Write a structured self-audit into Eve durable session memory after benchmark or delivery feedback.",
  inputSchema: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    nextBenchmarkFocus: z.array(z.string()),
  }),
  async execute(input) {
    const audit = {
      createdAt: new Date().toISOString(),
      strengths: input.strengths,
      weaknesses: input.weaknesses,
      nextBenchmarkFocus: input.nextBenchmarkFocus,
    };
    proofArenaMemory.update((memory) => ({
      ...memory,
      lastSelfAudit: audit,
    }));
    return audit;
  },
});
