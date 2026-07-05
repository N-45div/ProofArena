import { defineEval } from "eve/evals";

export default defineEval({
  description: "Records a delivery outcome and reads it back as structured ASP memory.",
  tags: ["a2a", "self-learning", "memory"],
  async test(t) {
    await t.send(`
Record this ProofArena outcome:
ASP: BuildSmith
Category: software
Score: 62
Verdict: revise
Task hash: task-abc
Delivery hash: delivery-def
Risks: missing deployed URL, missing tests
Buyer outcome: revision_requested

Then summarize what you remember about BuildSmith.
`);
    t.completed();
    t.calledTool("remember_delivery_outcome");
    t.calledTool("get_self_profile");
    t.messageIncludes(/BuildSmith|revision|memory/i);
  },
});
