import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheckIcon, CircleAlertIcon, HistoryIcon, ShieldCheckIcon } from "lucide-react";
import { getAspProofProfile } from "@/lib/proofarena/asp-profile";
import { verifyProofCard } from "@/lib/proofarena/proof-card";

export default async function AspProfilePage({
  params,
}: {
  readonly params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const aspName = decodeURIComponent(name);
  const profile = await getAspProofProfile(aspName);
  if (profile.totalCards === 0) notFound();

  return (
    <main className="min-h-dvh bg-background px-5 py-8 text-foreground">
      <div className="mx-auto grid max-w-6xl gap-6">
        <header className="border-border border-b pb-5">
          <p className="text-muted-foreground text-sm">ProofArena ASP reputation</p>
          <h1 className="mt-1 font-semibold text-3xl tracking-normal">{profile.aspName}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-6">
            Reputation is computed only from signed ProofArena cards. It is evidence history, not a
            generic rating or hidden RAG profile.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Verified deliveries" value={String(profile.totalCards)} />
          <Metric label="Average score" value={String(profile.averageScore)} />
          <Metric label="Approve rate" value={`${profile.approvalRate}%`} />
          <Metric label="Revision rate" value={`${profile.revisionRate}%`} />
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="grid gap-5">
            <div className="rounded-lg border bg-card">
              <div className="border-border border-b px-4 py-3">
                <h2 className="font-medium">Categories</h2>
              </div>
              <div className="grid gap-3 p-4">
                {profile.categories.map((category) => (
                  <div className="flex items-center justify-between gap-4 rounded-md border bg-background px-3 py-2 text-sm" key={category.category}>
                    <div>
                      <p className="font-medium capitalize">{category.category}</p>
                      <p className="text-muted-foreground">{category.count} card(s)</p>
                    </div>
                    <span>{category.averageScore}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border bg-card">
              <div className="border-border border-b px-4 py-3">
                <h2 className="font-medium">Common risks</h2>
              </div>
              <div className="grid gap-2 p-4">
                {profile.commonRisks.length > 0 ? (
                  profile.commonRisks.map((risk) => (
                    <div className="flex items-center justify-between gap-4 rounded-md border bg-background px-3 py-2 text-sm" key={risk.risk}>
                      <span>{risk.risk}</span>
                      <span className="text-muted-foreground">{risk.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No recurring risks yet.</p>
                )}
              </div>
            </div>
          </div>

          <section className="rounded-lg border bg-card">
            <div className="flex items-center gap-2 border-border border-b px-4 py-3">
              <HistoryIcon className="size-4" />
              <h2 className="font-medium">Recent proof cards</h2>
            </div>
            <div className="grid gap-3 p-4">
              {profile.recentCards.map((card) => {
                const signatureValid = verifyProofCard(card);
                return (
                  <Link
                    className="rounded-md border bg-background p-4 transition-colors hover:bg-muted/50"
                    href={`/proof/${card.id}`}
                    key={card.id}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          {signatureValid ? (
                            <ShieldCheckIcon className="size-4 text-emerald-600" />
                          ) : (
                            <CircleAlertIcon className="size-4 text-destructive" />
                          )}
                          <p className="font-medium capitalize">{card.verdict}</p>
                        </div>
                        <p className="mt-1 text-muted-foreground text-sm">
                          {card.category} · {new Date(card.issuedAt).toUTCString()}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-semibold text-2xl">{card.score}</p>
                        <p className="text-muted-foreground text-xs">score</p>
                      </div>
                    </div>
                    {card.risks.length > 0 ? (
                      <p className="mt-3 text-amber-700 text-sm dark:text-amber-300">
                        {card.risks.slice(0, 3).join(", ")}
                      </p>
                    ) : (
                      <p className="mt-3 flex items-center gap-2 text-emerald-700 text-sm dark:text-emerald-300">
                        <BadgeCheckIcon className="size-4" />
                        No risks recorded.
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <div className="text-muted-foreground text-sm">{label}</div>
      <div className="mt-2 font-medium">{value}</div>
    </div>
  );
}
