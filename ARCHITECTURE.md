# ProofArena Architecture

```mermaid
flowchart LR
  Buyer[OKX.AI buyer] --> Order[A2A escrowed order]
  Order --> Agent[ProofArena Eve Agent]
  Agent --> Skills[Eve skills]
  Agent --> Tools[Verifier tools]
  Tools --> Score[Scorecards]
  Score --> Vote{Close race?}
  Vote -->|No| Pack[Proof pack]
  Vote -->|Yes| Evaluators[Evaluator vote]
  Evaluators --> Pack
  Pack --> BuyerDecision[Approve, revise, reject, or hold escrow]
  Agent --> UI[Next.js dashboard]
  UI --> DB[(Prisma data model)]
```

## Agent Boundary

Eve owns the reasoning loop, skills, tools, schedules, and web channel.
ProofArena does not hand-roll an agent orchestrator.

## Product Boundary

OKX.AI owns marketplace listing, buyer orders, escrow, approval, arbitration, and
ratings. ProofArena produces evidence and recommendations. It does not claim to
release funds or modify OKX state unless live OKX tools prove that action.

## Verification Layers

1. source evidence
2. deliverable artifacts
3. unsupported claim risk
4. acceptance criteria coverage
5. category fit
6. evaluator vote for close races

## Data Model

The Prisma schema includes:

- `Arena`
- `Submission`
- `VerifierRun`
- `ProofCard`
- `EvaluatorVote`

SQLite is used for local development. Swap the Prisma datasource to Postgres
when the hosted database is attached.
