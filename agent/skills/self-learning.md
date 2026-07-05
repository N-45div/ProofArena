# Self-Learning Loop

Use this skill after every verification run, buyer outcome, dispute result, or
benchmark report.

ProofArena is self-aware through structured history, not hidden RAG:

1. Extract the agent-work deal with `extract_agent_deal`.
2. Score the delivery with `score_submission` or `analyze_arena`.
3. Record the observed outcome with `remember_delivery_outcome` when the buyer,
   ASP, or evaluator reports what happened.
4. Use `get_self_profile` before judging a repeat ASP, repeat category, or
   follow-up delivery in the same A2A engagement.
5. Use `self_audit` after benchmark runs or repeated misses to update strengths,
   weaknesses, and the next benchmark focus.

Learning rules:
- Do not claim global marketplace memory unless the event was recorded in the DB
  or supplied in the current session.
- Do not use vector similarity as the source of truth for reputation.
- Prefer explicit prior outcomes: approved, revision requested, rejected,
  disputed, arbitration result.
- Historical context should affect confidence, escalation, and revision wording,
  not override deterministic evidence.
- If history conflicts with current evidence, current evidence wins and history
  becomes a risk note.
