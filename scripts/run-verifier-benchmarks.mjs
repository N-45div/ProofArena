import { mkdir, writeFile } from "node:fs/promises";
import { demoArena } from "../lib/proofarena/demo-data.ts";
import { extractDealFromConversation } from "../lib/proofarena/deal-parser.ts";
import { evaluateArena, scoreSubmission } from "../lib/proofarena/evaluator.ts";
import { VERIFIER_VERSION } from "../lib/proofarena/learning.ts";
import { createSignedProofCard, verifyProofCard } from "../lib/proofarena/proof-card.ts";

const cases = [
  {
    id: "finance-arena-winner",
    run() {
      const result = evaluateArena(demoArena);
      return {
        passed: result.winner.aspName === "FundingHawk" && result.winner.verdict === "approve",
        observed: result.winner,
      };
    },
  },
  {
    id: "software-missing-deploy-revises",
    run() {
      const submission = {
        id: "sub-buildsmith",
        aspName: "BuildSmith",
        category: "software",
        title: "Next.js landing page delivery",
        summary:
          "The ASP provided a GitHub repo and screenshots, but did not include a deployed URL or test log.",
        sources: ["https://github.com/example/proof-demo"],
        artifacts: ["README.md", "screenshot.png"],
        claims: ["The landing page is complete but deployment is coming later."],
        submittedAt: new Date("2026-07-05T12:00:00.000Z").toISOString(),
      };
      const scorecard = scoreSubmission(submission, [
        "GitHub repo",
        "deployed URL",
        "test log",
        "mobile screenshots",
      ]);
      return {
        passed: scorecard.verdict === "revise" && scorecard.risks.length > 0,
        observed: scorecard,
      };
    },
  },
  {
    id: "deal-parser-extracts-hashes",
    run() {
      const deal = extractDealFromConversation({
        conversation: `
Buyer: Build a Next.js dashboard with GitHub repo, deployed URL, and test logs.
ASP: I will provide the repo, deployment, screenshots, and README.
Delivery: Repo https://github.com/example/proof-demo. README.md included. No deployment yet.
`,
      });
      return {
        passed:
          deal.category === "software" &&
          deal.taskHash.length === 64 &&
          deal.deliveryHash.length === 64 &&
          deal.missingEvidence.length > 0,
        observed: deal,
      };
    },
  },
  {
    id: "signed-proof-card-verifies",
    run() {
      const card = createSignedProofCard({
        aspName: "BuildSmith",
        taskText:
          "Buyer: Build a Next.js dashboard with GitHub repo, deployed URL, mobile screenshots, and test logs.",
        deliveryText:
          "Delivery: Repo https://github.com/example/proof-demo. README.md and screenshot.png included. Deployment and test logs are coming later.",
        artifacts: ["README.md", "screenshot.png"],
        sources: ["https://github.com/example/proof-demo"],
      });
      return {
        passed:
          verifyProofCard(card) &&
          card.taskHash.length === 64 &&
          card.deliveryHash.length === 64 &&
          card.signature.length === 64 &&
          card.verdict === "revise",
        observed: card,
      };
    },
  },
];

const results = cases.map((testCase) => {
  try {
    return { id: testCase.id, ...testCase.run() };
  } catch (error) {
    return {
      id: testCase.id,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

const summary = {
  suite: "proofarena-verifier",
  verifierVersion: VERIFIER_VERSION,
  passed: results.filter((result) => result.passed).length,
  failed: results.filter((result) => !result.passed).length,
  results,
  createdAt: new Date().toISOString(),
};

await mkdir(".internal/benchmark-runs", { recursive: true });
await writeFile(".internal/benchmark-runs/latest.json", JSON.stringify(summary, null, 2));

console.log(JSON.stringify(summary, null, 2));
process.exitCode = summary.failed === 0 ? 0 : 1;
