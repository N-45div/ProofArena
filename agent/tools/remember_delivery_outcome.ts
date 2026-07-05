import { defineTool } from "eve/tools";
import { z } from "zod";
import { buildLearningEvent } from "@/lib/proofarena/learning";
import { proofArenaMemory } from "../lib/session-memory";

const scorecardSchema = z.object({
  submissionId: z.string(),
  aspName: z.string(),
  score: z.number(),
  verdict: z.enum(["approve", "revise", "reject"]),
  checks: z.array(
    z.object({
      label: z.string(),
      passed: z.boolean(),
      score: z.number(),
      evidence: z.string(),
    }),
  ),
  risks: z.array(z.string()),
});

export default defineTool({
  description:
    "Record an observed verification outcome into Eve durable session memory so the agent can adapt within the A2A engagement.",
  inputSchema: z.object({
    scorecard: scorecardSchema,
    category: z.string(),
    taskHash: z.string(),
    deliveryHash: z.string(),
    buyerOutcome: z.enum(["approved", "revision_requested", "rejected", "disputed"]).optional(),
    disputeOutcome: z.enum(["asp_won", "buyer_won", "settled"]).optional(),
  }),
  async execute(input) {
    const event = buildLearningEvent({
      scorecard: input.scorecard,
      category: input.category,
      taskHash: input.taskHash,
      deliveryHash: input.deliveryHash,
      risks: input.scorecard.risks,
      buyerOutcome: input.buyerOutcome,
      disputeOutcome: input.disputeOutcome,
    });
    proofArenaMemory.update((memory) => ({
      ...memory,
      learnedEvents: [...memory.learnedEvents, event].slice(-50),
    }));
    return {
      recorded: true,
      event,
      learnedEventCount: proofArenaMemory.get().learnedEvents.length,
    };
  },
});
