import { mkdir, writeFile } from "node:fs/promises";
import { demoArena } from "../lib/proofarena/demo-data.ts";
import { extractDealFromConversation } from "../lib/proofarena/deal-parser.ts";
import { evaluateArena, scoreSubmission } from "../lib/proofarena/evaluator.ts";
import { VERIFIER_VERSION } from "../lib/proofarena/learning.ts";
import { createSignedProofCard, verifyProofCard } from "../lib/proofarena/proof-card.ts";
import { getAspProofProfileFromCards } from "../lib/proofarena/asp-profile.ts";

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
    async run() {
      const card = await createSignedProofCard({
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
          card.verdict === "revise" &&
          card.softwareEvidence?.repoUrls.length === 1 &&
          card.checks.some((check) => check.label === "Deployment proof" && !check.passed),
        observed: card,
      };
    },
  },
  {
    id: "asp-profile-aggregates-proof-history",
    async run() {
      const cards = [
        await createSignedProofCard({
          aspName: "BuildSmith",
          taskText: "Buyer: Build a Next.js dashboard with repo, deployment, package.json, build log, and tests.",
          deliveryText:
            "Delivery: Repo https://github.com/example/proof-demo. Deployment https://proof-demo.example.com. package.json, build-log.txt, and test-log.txt included.",
          artifacts: ["package.json", "build-log.txt", "test-log.txt"],
          sources: ["https://github.com/example/proof-demo", "https://proof-demo.example.com"],
        }),
        await createSignedProofCard({
          aspName: "BuildSmith",
          taskText: "Buyer: Build a Next.js dashboard with GitHub repo, deployed URL, and test logs.",
          deliveryText:
            "Delivery: Repo https://github.com/example/proof-demo. README.md included. Deployment and test logs are coming later.",
          artifacts: ["README.md"],
          sources: ["https://github.com/example/proof-demo"],
        }),
      ];
      const profile = getAspProofProfileFromCards("BuildSmith", cards);
      return {
        passed:
          profile.totalCards === 2 &&
          profile.categories.some((category) => category.category === "software") &&
          profile.revisionRate > 0,
        observed: profile,
      };
    },
  },
  {
    id: "benchmark-log-counts-as-test-evidence",
    async run() {
      const card = await createSignedProofCard({
        aspName: "ProofArena",
        taskText: "Buyer: Provide repo, deployed URL, package evidence, build log, and verifier benchmark output.",
        deliveryText:
          "Delivery: Repo https://github.com/N-45div/ProofArena. Deployment https://proofarena-two.vercel.app. package.json included. npm run build passed. npm run benchmark:verifier passed.",
        artifacts: ["package.json", "build-log.txt", "benchmark-log.txt"],
        sources: ["https://github.com/N-45div/ProofArena", "https://proofarena-two.vercel.app"],
      });
      return {
        passed:
          card.softwareEvidence?.testEvidence.some((value) => value.includes("benchmark")) &&
          card.checks.some((check) => check.label === "Build/test evidence" && check.passed),
        observed: card.softwareEvidence,
      };
    },
  },
];

const results = await Promise.all(cases.map(async (testCase) => {
  try {
    return { id: testCase.id, ...(await testCase.run()) };
  } catch (error) {
    return {
      id: testCase.id,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}));

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
