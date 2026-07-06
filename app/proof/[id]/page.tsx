import { notFound } from "next/navigation";
import { BadgeCheckIcon, CircleAlertIcon, CopyIcon, ShieldCheckIcon } from "lucide-react";
import { readProofCard } from "@/lib/proofarena/proof-store";
import { verifyProofCard } from "@/lib/proofarena/proof-card";

export default async function ProofPage({ params }: { readonly params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = await readProofCard(id).catch(() => null);
  if (!card) notFound();
  const valid = verifyProofCard(card);

  return (
    <main className="min-h-dvh bg-background px-5 py-8 text-foreground">
      <div className="mx-auto grid max-w-5xl gap-6">
        <header className="border-border border-b pb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-muted-foreground text-sm">ProofArena signed proof card</p>
              <h1 className="mt-1 font-semibold text-3xl tracking-normal">{card.aspName}</h1>
            </div>
            <div
              className={
                valid
                  ? "flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-emerald-700 text-sm dark:text-emerald-300"
                  : "flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive text-sm"
              }
            >
              {valid ? <ShieldCheckIcon className="size-4" /> : <CircleAlertIcon className="size-4" />}
              {valid ? "signature valid" : "signature invalid"}
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Verdict" value={card.verdict} />
          <Metric label="Score" value={String(card.score)} />
          <Metric label="Category" value={card.category} />
          <Metric label="Verifier" value={card.verifierVersion} />
        </section>

        <section className="rounded-lg border bg-card">
          <div className="border-border border-b px-4 py-3">
            <h2 className="font-medium">Buyer message</h2>
          </div>
          <p className="p-4 text-sm leading-6">{card.buyerMessage}</p>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-lg border bg-card">
            <div className="border-border border-b px-4 py-3">
              <h2 className="font-medium">Checks</h2>
            </div>
            <div className="grid gap-3 p-4">
              {card.checks.map((check) => (
                <div className="rounded-md border bg-background px-3 py-2 text-sm" key={check.label}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{check.label}</span>
                    <span className={check.passed ? "text-emerald-600" : "text-amber-600"}>
                      {check.passed ? "passed" : "review"}
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground">{check.evidence}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-card">
            <div className="border-border border-b px-4 py-3">
              <h2 className="font-medium">Integrity</h2>
            </div>
            <div className="grid gap-3 p-4 text-sm">
              <HashRow label="Task" value={card.taskHash} />
              <HashRow label="Delivery" value={card.deliveryHash} />
              <HashRow label="Signature" value={card.signature} />
              <div>
                <p className="text-muted-foreground">Issued</p>
                <p className="mt-1">{new Date(card.issuedAt).toUTCString()}</p>
              </div>
            </div>
          </div>
        </section>

        {card.risks.length > 0 ? (
          <section className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-amber-800 text-sm dark:text-amber-200">
            Risks: {card.risks.join(", ")}
          </section>
        ) : null}

        {card.softwareEvidence ? (
          <section className="rounded-lg border bg-card">
            <div className="border-border border-b px-4 py-3">
              <h2 className="font-medium">Software evidence</h2>
            </div>
            <div className="grid gap-4 p-4 text-sm md:grid-cols-2">
              <EvidenceList label="Repositories" values={card.softwareEvidence.repoUrls} />
              <EvidenceList label="Deployments" values={card.softwareEvidence.deploymentUrls} />
              <EvidenceList label="Package/install" values={card.softwareEvidence.packageEvidence} />
              <EvidenceList label="Build/test" values={[...card.softwareEvidence.buildEvidence, ...card.softwareEvidence.testEvidence]} />
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function Metric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <div className="text-muted-foreground text-sm">{label}</div>
      <div className="mt-2 font-medium capitalize">{value}</div>
    </div>
  );
}

function HashRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 break-all font-mono text-xs">{value}</p>
    </div>
  );
}

function EvidenceList({ label, values }: { readonly label: string; readonly values: readonly string[] }) {
  return (
    <div>
      <p className="font-medium">{label}</p>
      {values.length > 0 ? (
        <ul className="mt-2 grid gap-1 text-muted-foreground">
          {values.map((value) => (
            <li className="break-all" key={value}>{value}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-muted-foreground">No evidence detected.</p>
      )}
    </div>
  );
}
