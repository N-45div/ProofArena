import { defineState } from "eve/context";
import type { LearningEvent } from "@/lib/proofarena/learning";

export type ProofArenaSessionMemory = {
  readonly learnedEvents: readonly LearningEvent[];
  readonly lastSelfAudit?: {
    readonly createdAt: string;
    readonly strengths: readonly string[];
    readonly weaknesses: readonly string[];
    readonly nextBenchmarkFocus: readonly string[];
  };
};

export const proofArenaMemory = defineState<ProofArenaSessionMemory>(
  "proofarena.session-memory",
  () => ({
    learnedEvents: [],
  }),
);
