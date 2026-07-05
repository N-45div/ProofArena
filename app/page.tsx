import {
  AlertTriangleIcon,
  BadgeCheckIcon,
  CircleDollarSignIcon,
  GavelIcon,
  ScaleIcon,
  TrophyIcon,
} from "lucide-react";
import type React from "react";
import { AgentChat } from "@/app/_components/agent-chat";
import { ProofCardWorkbench } from "@/app/_components/proof-card-workbench";
import { demoArena } from "@/lib/proofarena/demo-data";
import { evaluateArena, generateProofPack } from "@/lib/proofarena/evaluator";

const result = evaluateArena(demoArena);
const proofPack = generateProofPack(demoArena, result);

export default function Page() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[minmax(0,1fr)_480px]">
        <section className="min-w-0 border-border border-r">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-5 sm:px-7 lg:px-8">
            <header className="flex flex-col gap-4 border-border border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-muted-foreground text-sm">OKX.AI A2A proof arena</p>
                <h1 className="mt-1 text-balance font-semibold text-3xl tracking-normal sm:text-4xl">
                  ProofArena
                </h1>
                <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-6">
                  Embedded signed proof cards for OKX.AI ASP deliveries. Verify the task,
                  delivery, artifacts, and risks before a buyer releases escrow.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-emerald-700 text-sm dark:text-emerald-300">
                <BadgeCheckIcon className="size-4" />
                Signed proof-card flow live
              </div>
            </header>

            <ProofCardWorkbench />

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric icon={<ScaleIcon className="size-4" />} label="Category" value={demoArena.category} />
              <Metric
                icon={<TrophyIcon className="size-4" />}
                label="Winner"
                value={result.winner.aspName}
              />
              <Metric
                icon={<GavelIcon className="size-4" />}
                label="Decision"
                value={proofPack.recommendation.replaceAll("_", " ")}
              />
              <Metric
                icon={<CircleDollarSignIcon className="size-4" />}
                label="Escrow release"
                value={proofPack.releaseEscrow ? "recommended" : "hold"}
              />
            </div>

            <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-lg border bg-card">
                <div className="border-border border-b px-4 py-3">
                  <h2 className="font-medium text-base">{demoArena.title}</h2>
                  <p className="mt-1 text-muted-foreground text-sm">Buyer: {demoArena.buyer}</p>
                </div>
                <div className="grid gap-2 p-4">
                  {demoArena.acceptanceCriteria.map((criterion) => (
                    <div
                      className="flex items-start gap-2 rounded-md border bg-background px-3 py-2 text-sm"
                      key={criterion}
                    >
                      <BadgeCheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      <span>{criterion}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border bg-card">
                <div className="border-border border-b px-4 py-3">
                  <h2 className="font-medium text-base">Proof pack</h2>
                  <p className="mt-1 text-muted-foreground text-sm">{proofPack.evaluatorNote}</p>
                </div>
                <div className="grid gap-3 p-4">
                  {proofPack.evidenceSummary.map((item) => (
                    <div className="grid gap-1 text-sm" key={item.check}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">{item.check}</span>
                        <span
                          className={
                            item.passed
                              ? "text-emerald-600 dark:text-emerald-300"
                              : "text-amber-600 dark:text-amber-300"
                          }
                        >
                          {item.passed ? "passed" : "needs review"}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{item.evidence}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-lg border bg-card">
              <div className="flex items-center justify-between gap-4 border-border border-b px-4 py-3">
                <div>
                  <h2 className="font-medium text-base">Submission leaderboard</h2>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Deterministic checks first; evaluator vote only when scores are close.
                  </p>
                </div>
                {result.closeRace ? (
                  <div className="flex items-center gap-2 rounded-md border border-amber-500/30 px-2.5 py-1.5 text-amber-700 text-sm dark:text-amber-300">
                    <AlertTriangleIcon className="size-4" />
                    close race
                  </div>
                ) : null}
              </div>
              <div className="grid gap-4 p-4">
                {result.scorecards.map((scorecard, index) => (
                  <article className="rounded-md border bg-background p-4" key={scorecard.submissionId}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded-md bg-foreground text-background text-sm">
                            {index + 1}
                          </span>
                          <h3 className="font-medium">{scorecard.aspName}</h3>
                        </div>
                        <p className="mt-2 text-muted-foreground text-sm">
                          Verdict: <span className="font-medium text-foreground">{scorecard.verdict}</span>
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="font-semibold text-3xl">{scorecard.score}</div>
                        <div className="text-muted-foreground text-xs">proof score</div>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 md:grid-cols-2">
                      {scorecard.checks.map((check) => (
                        <div className="rounded-md border px-3 py-2 text-sm" key={check.label}>
                          <div className="flex items-center justify-between gap-3">
                            <span>{check.label}</span>
                            <span className="text-muted-foreground">{check.score}</span>
                          </div>
                          <p className="mt-1 text-muted-foreground text-xs">{check.evidence}</p>
                        </div>
                      ))}
                    </div>
                    {scorecard.risks.length > 0 ? (
                      <div className="mt-3 text-amber-700 text-sm dark:text-amber-300">
                        Risks: {scorecard.risks.join(", ")}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          </div>
        </section>
        <aside className="min-h-[720px] bg-card">
          <AgentChat />
        </aside>
      </div>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 truncate font-medium capitalize">{value}</div>
    </div>
  );
}
