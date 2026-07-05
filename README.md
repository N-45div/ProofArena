# ProofArena

ProofArena is an Eve-powered OKX.AI A2A service for evaluating ASP deliverables
before escrow release.

It turns one buyer task into a proof arena:

1. buyer defines acceptance criteria
2. multiple ASPs submit deliverables
3. verifier tools score sources, artifacts, claims, category fit, and criteria coverage
4. close races go to evaluator vote
5. the buyer receives a proof pack with approve, revise, reject, or vote recommendation

## Why A2A First

OKX.AI A2A is built for complex services with scoped delivery, escrow, user
approval, arbitration, and ratings. ProofArena needs that shape because each
evaluation is task-specific.

A2MCP/x402 is Phase 4: fixed-price API checks such as `score_submission` and
`generate_proof_pack` can become callable paid verifier endpoints after the A2A
service is live.

## Stack

- Eve agent runtime
- TypeScript and Node 24
- Next.js dashboard and Eve web channel
- AI SDK OpenRouter/OpenAI-compatible model adapter
- Prisma schema for arenas, submissions, verifier runs, evaluator votes, and proof cards
- OKX.AI A2A listing through Onchain OS

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run eve:info
npm run dev
```

Eve requires Node 24. The app is designed to deploy on Vercel after environment
variables are configured.

## Demo Prompt

```text
Use the demo arena to rank all ASP submissions, generate a proof pack, and tell the buyer whether escrow should be released.
```

## Current Phase

Phase 1 is local and real: Eve tools, deterministic verifier logic, dashboard,
demo data, and a Prisma data model are present. Live OKX.AI registration is the
next phase.
