import type { CheckResult } from "./evaluator.ts";

export type SoftwareArtifactEvidence = {
  readonly repoUrls: readonly string[];
  readonly deploymentUrls: readonly string[];
  readonly packageEvidence: readonly string[];
  readonly testEvidence: readonly string[];
  readonly buildEvidence: readonly string[];
};

export type SoftwareArtifactReport = {
  readonly evidence: SoftwareArtifactEvidence;
  readonly checks: readonly CheckResult[];
  readonly risks: readonly string[];
};

const URL_RE = /https?:\/\/[^\s),\]]+/gi;
const GITHUB_RE = /^https?:\/\/(www\.)?github\.com\/[^/\s]+\/[^/\s.]+/i;

export async function verifySoftwareArtifacts(input: {
  readonly taskText: string;
  readonly deliveryText: string;
  readonly artifacts: readonly string[];
  readonly sources: readonly string[];
  readonly liveUrlChecks?: boolean;
}): Promise<SoftwareArtifactReport> {
  const text = `${input.taskText}\n${input.deliveryText}\n${input.artifacts.join("\n")}\n${input.sources.join("\n")}`;
  const urls = Array.from(text.matchAll(URL_RE), (match) => cleanUrl(match[0]));
  const repoUrls = unique(urls.filter((url) => GITHUB_RE.test(url)));
  const deploymentUrls = unique(
    urls.filter((url) => !GITHUB_RE.test(url) && !/okx\.ai|github\.com/i.test(url)),
  );
  const packageEvidence = unique(
    [...input.artifacts, ...input.sources, input.deliveryText].filter((value) =>
      /\b(package\.json|pnpm-lock|yarn\.lock|package-lock|npm install|pnpm install|yarn install)\b/i.test(value),
    ),
  );
  const testEvidence = unique(
    [...input.artifacts, input.deliveryText].filter((value) =>
      /\b(test|tests|vitest|jest|playwright|cypress|test-log|coverage)\b/i.test(value),
    ),
  );
  const buildEvidence = unique(
    [...input.artifacts, input.deliveryText].filter((value) =>
      /\b(build|next build|npm run build|pnpm build|build-log|compiled|deployment)\b/i.test(value),
    ),
  );

  const liveChecks = input.liveUrlChecks ?? process.env.PROOFARENA_LIVE_URL_CHECKS === "1";
  const repoReachable = await summarizeReachability(repoUrls, liveChecks);
  const deployReachable = await summarizeReachability(deploymentUrls, liveChecks);

  const checks: CheckResult[] = [
    {
      label: "GitHub repo proof",
      passed: repoUrls.length > 0 && (!liveChecks || repoReachable.reachable > 0),
      score: repoUrls.length === 0 ? 25 : !liveChecks ? 76 : repoReachable.reachable > 0 ? 92 : 48,
      evidence:
        repoUrls.length === 0
          ? "No GitHub repository URL was detected."
          : liveChecks
            ? `${repoReachable.reachable}/${repoUrls.length} GitHub repo URL(s) responded.`
            : `${repoUrls.length} GitHub repo URL(s) detected; live reachability check disabled.`,
    },
    {
      label: "Deployment proof",
      passed: deploymentUrls.length > 0 && (!liveChecks || deployReachable.reachable > 0),
      score: deploymentUrls.length === 0 ? 25 : !liveChecks ? 72 : deployReachable.reachable > 0 ? 92 : 45,
      evidence:
        deploymentUrls.length === 0
          ? "No deployed application URL was detected."
          : liveChecks
            ? `${deployReachable.reachable}/${deploymentUrls.length} deployment URL(s) responded.`
            : `${deploymentUrls.length} deployment URL(s) detected; live reachability check disabled.`,
    },
    {
      label: "Package/run evidence",
      passed: packageEvidence.length > 0,
      score: packageEvidence.length > 0 ? 85 : 45,
      evidence:
        packageEvidence.length > 0
          ? `${packageEvidence.length} package or install signal(s) detected.`
          : "No package manager, install, or package.json evidence was detected.",
    },
    {
      label: "Build/test evidence",
      passed: testEvidence.length > 0 && buildEvidence.length > 0,
      score: testEvidence.length > 0 && buildEvidence.length > 0 ? 90 : testEvidence.length > 0 || buildEvidence.length > 0 ? 63 : 35,
      evidence: `${testEvidence.length} test signal(s), ${buildEvidence.length} build signal(s) detected.`,
    },
  ];

  return {
    evidence: {
      repoUrls,
      deploymentUrls,
      packageEvidence,
      testEvidence,
      buildEvidence,
    },
    checks,
    risks: checks.filter((check) => !check.passed).map((check) => check.label),
  };
}

function cleanUrl(url: string) {
  return url.replace(/[),.;\]]+$/g, "");
}

function unique(values: readonly string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

async function summarizeReachability(urls: readonly string[], enabled: boolean) {
  if (!enabled) return { reachable: 0, checked: 0 };
  const results = await Promise.all(urls.map((url) => checkReachable(url)));
  return {
    reachable: results.filter(Boolean).length,
    checked: results.length,
  };
}

async function checkReachable(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    });
    if (response.ok || response.status === 405) return true;
    if (response.status >= 300 && response.status < 500) return true;
    return false;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
