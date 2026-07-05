"use client";

import { useState } from "react";
import { BadgeCheckIcon, CopyIcon, ExternalLinkIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type GeneratedProof = {
  readonly proofUrl: string;
  readonly card: {
    readonly aspName: string;
    readonly verdict: "approve" | "revise" | "reject";
    readonly score: number;
    readonly signature: string;
    readonly taskHash: string;
    readonly deliveryHash: string;
    readonly buyerMessage: string;
    readonly risks: readonly string[];
  };
};

const initialTask = `Buyer: Build a Next.js dashboard with GitHub repo, deployed URL, mobile screenshots, and test logs.
ASP: I will provide the repo, deployment, screenshots, README, and logs.`;

const initialDelivery = `Delivery: Repo https://github.com/example/proof-demo. README.md and screenshot.png are included. Deployment and test logs are coming later.`;

export function ProofCardWorkbench() {
  const [aspName, setAspName] = useState("BuildSmith");
  const [taskText, setTaskText] = useState(initialTask);
  const [deliveryText, setDeliveryText] = useState(initialDelivery);
  const [artifacts, setArtifacts] = useState("README.md\nscreenshot.png");
  const [sources, setSources] = useState("https://github.com/example/proof-demo");
  const [generated, setGenerated] = useState<GeneratedProof | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function generateProofCard() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/proof-cards", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          aspName,
          taskText,
          deliveryText,
          artifacts: splitLines(artifacts),
          sources: splitLines(sources),
        }),
      });
      if (!response.ok) throw new Error("Failed to create proof card");
      setGenerated(await response.json());
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-lg border bg-card">
      <div className="flex flex-col gap-3 border-border border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-medium text-base">ASP proof-card workbench</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Paste the OKX.AI task and your delivery. ProofArena signs a shareable escrow proof card.
          </p>
        </div>
        <Button disabled={isLoading} onClick={generateProofCard}>
          {isLoading ? "Signing..." : "Generate proof card"}
          <ShieldCheckIcon />
        </Button>
      </div>

      <div className="grid gap-4 p-4 xl:grid-cols-[1fr_0.85fr]">
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">ASP name</span>
            <input
              className="h-10 rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setAspName(event.target.value)}
              value={aspName}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">OKX.AI task / conversation</span>
            <Textarea className="min-h-28" onChange={(event) => setTaskText(event.target.value)} value={taskText} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Delivery</span>
            <Textarea
              className="min-h-28"
              onChange={(event) => setDeliveryText(event.target.value)}
              value={deliveryText}
            />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Artifacts</span>
              <Textarea className="min-h-24" onChange={(event) => setArtifacts(event.target.value)} value={artifacts} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Sources</span>
              <Textarea className="min-h-24" onChange={(event) => setSources(event.target.value)} value={sources} />
            </label>
          </div>
        </div>

        <div className="rounded-md border bg-background p-4">
          {generated ? (
            <div className="grid gap-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BadgeCheckIcon className="size-5 text-emerald-600" />
                  <span className="font-medium">Signed proof ready</span>
                </div>
                <span className="rounded-md border px-2 py-1 text-sm capitalize">{generated.card.verdict}</span>
              </div>
              <div>
                <div className="font-semibold text-4xl">{generated.card.score}</div>
                <div className="text-muted-foreground text-xs">proof score</div>
              </div>
              <p className="text-sm leading-6">{generated.card.buyerMessage}</p>
              <div className="grid gap-2 text-xs">
                <Hash label="Task hash" value={generated.card.taskHash} />
                <Hash label="Delivery hash" value={generated.card.deliveryHash} />
                <Hash label="Signature" value={generated.card.signature} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <a href={generated.proofUrl} rel="noreferrer" target="_blank">
                    Open proof
                    <ExternalLinkIcon />
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(`${location.origin}${generated.proofUrl}`)}
                >
                  Copy link
                  <CopyIcon />
                </Button>
              </div>
              {generated.card.risks.length > 0 ? (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-amber-700 text-sm dark:text-amber-300">
                  {generated.card.risks.join(", ")}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-96 flex-col items-center justify-center gap-3 text-center">
              <SparklesIcon className="size-8 text-muted-foreground" />
              <div>
                <p className="font-medium">No proof card yet</p>
                <p className="mt-1 max-w-sm text-muted-foreground text-sm">
                  Generate a signed proof card that an ASP can attach directly to its OKX.AI delivery.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function Hash({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 break-all font-mono">{value}</p>
    </div>
  );
}
