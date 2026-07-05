"use client";

import { useEveAgent } from "eve/react";
import { AlertCircleIcon, ExternalLinkIcon, ShieldCheckIcon } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { cn } from "@/lib/utils";
import { AgentMessage } from "./agent-message";
import { Button } from "@/components/ui/button";

const AGENT_NAME = "ProofArena";
const BETA_TERMS_HREF = "https://vercel.com/docs/release-phases/public-beta-agreement";

type AgentStatus = ReturnType<typeof useEveAgent>["status"];

export function AgentChat() {
  const agent = useEveAgent();
  const isBusy = agent.status === "submitted" || agent.status === "streaming";
  const isEmpty = agent.data.messages.length === 0;
  const pendingAuthorization = getPendingAuthorization(agent.events);

  const handleSubmit = async (message: PromptInputMessage) => {
    const text = message.text.trim();
    if (!text || isBusy) return;

    await agent.send({ message: text });
  };

  const composer = (
    <PromptInput onSubmit={handleSubmit}>
      <PromptInputTextarea placeholder="Send a message…" />
      <PromptInputSubmit onStop={agent.stop} status={agent.status} />
    </PromptInput>
  );

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      {isEmpty ? null : (
        <header className="flex h-14 shrink-0 items-center justify-center gap-3 pl-4 pr-2">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-muted-foreground text-sm">{AGENT_NAME}</span>
            <StatusDot status={agent.status} />
          </span>
          <a
            className="rounded-full border border-amber-500/30 px-2 py-0.5 font-medium text-amber-700 text-xs transition-colors hover:bg-amber-500/10 dark:text-amber-300"
            href={BETA_TERMS_HREF}
            rel="noreferrer"
            target="_blank"
          >
            Public preview
          </a>
        </header>
      )}

      {agent.error ? (
        <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pt-2 sm:px-6">
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div>
              <p className="font-medium">Request failed</p>
              <p className="mt-0.5 text-muted-foreground">{agent.error.message}</p>
            </div>
          </div>
        </div>
      ) : null}

      {pendingAuthorization ? (
        <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pt-2 sm:px-6">
          <div className="flex flex-col gap-3 rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-300" />
              <div className="min-w-0">
                <p className="font-medium">
                  Connect {pendingAuthorization.displayName} to continue
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  The agent is paused until the requested connection is authorized. Complete the
                  sign-in flow, then return to this chat.
                </p>
              </div>
            </div>
            <Button asChild className="shrink-0" size="sm">
              <a href={pendingAuthorization.url} rel="noreferrer" target="_blank">
                Connect
                <ExternalLinkIcon />
              </a>
            </Button>
          </div>
        </div>
      ) : null}

      {isEmpty ? null : (
        <Conversation className="min-h-0 flex-1">
          <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-6 sm:px-6">
            {agent.data.messages.map((message, index) => (
              <AgentMessage
                canRespond={!isBusy}
                isStreaming={
                  agent.status === "streaming" && index === agent.data.messages.length - 1
                }
                key={message.id}
                message={message}
                onInputResponses={(inputResponses) => agent.send({ inputResponses })}
              />
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      )}

      <div
        className={cn(
          "mx-auto w-full px-4 sm:px-6",
          isEmpty
            ? "flex max-w-xl flex-1 flex-col items-center justify-center gap-8 pb-[10vh]"
            : "max-w-3xl shrink-0 pb-6",
        )}
      >
        {isEmpty ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="font-medium text-4xl tracking-normal">{AGENT_NAME}</h1>
            <p className="max-w-sm text-muted-foreground text-sm">
              Ask the Eve agent to rank the demo arena, generate a proof pack, or draft the OKX.AI
              A2A delivery message.
            </p>
            <a
              className="rounded-full border border-amber-500/30 px-2 py-0.5 font-medium text-amber-700 text-xs transition-colors hover:bg-amber-500/10 dark:text-amber-300"
              href={BETA_TERMS_HREF}
              rel="noreferrer"
              target="_blank"
            >
              Public preview
            </a>
          </div>
        ) : null}
        <div className="w-full">{composer}</div>
      </div>
    </main>
  );
}

type PendingAuthorization = {
  readonly displayName: string;
  readonly name: string;
  readonly turnId: string;
  readonly url: string;
};

function getPendingAuthorization(events: ReturnType<typeof useEveAgent>["events"]) {
  const completed = new Set<string>();

  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.type === "authorization.completed") {
      completed.add(`${event.data.turnId}:${event.data.name}`);
      continue;
    }

    if (event.type !== "authorization.required") {
      continue;
    }

    const key = `${event.data.turnId}:${event.data.name}`;
    if (completed.has(key)) {
      continue;
    }

    const url = event.data.authorization?.url;
    if (!url) {
      continue;
    }

    return {
      displayName: event.data.authorization?.displayName || event.data.name,
      name: event.data.name,
      turnId: event.data.turnId,
      url,
    } satisfies PendingAuthorization;
  }

  return null;
}

function StatusDot({ status }: { readonly status: AgentStatus }) {
  const isLive = status === "submitted" || status === "streaming";
  const tone =
    status === "error"
      ? "bg-destructive"
      : isLive
        ? "bg-emerald-500"
        : status === "ready"
          ? "bg-muted-foreground"
          : "bg-muted-foreground/50";

  return (
    <span className="relative flex size-1">
      {isLive ? (
        <span
          className={cn(
            "absolute inline-flex size-full animate-ping rounded-full opacity-75",
            tone,
          )}
        />
      ) : null}
      <span className={cn("relative inline-flex size-1 rounded-full transition-colors", tone)} />
    </span>
  );
}
