import { defineTool } from "eve/tools";
import { z } from "zod";
import { summarizeAspMemory } from "@/lib/proofarena/learning";
import { proofArenaMemory } from "../lib/session-memory";

export default defineTool({
  description:
    "Read ProofArena's structured session memory and summarize what it has learned about an ASP or the current engagement.",
  inputSchema: z.object({
    aspName: z.string().optional(),
  }),
  async execute(input) {
    const memory = proofArenaMemory.get();
    const aspName = input.aspName || memory.learnedEvents.at(-1)?.aspName || "unknown ASP";
    return {
      profile: summarizeAspMemory(aspName, memory.learnedEvents),
      memorySize: memory.learnedEvents.length,
      lastSelfAudit: memory.lastSelfAudit || null,
    };
  },
});
