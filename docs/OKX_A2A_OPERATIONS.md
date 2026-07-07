# OKX A2A Operations

ProofArena has two production surfaces:

1. Vercel hosts the Next.js app, Eve web channel, proof-card pages, and API.
2. An always-on host runs the OKX A2A responder with `okx-a2a`.

The OKX.AI listing verification checks the second surface. A healthy Vercel
deployment is not enough for A2A listing approval because `okx-a2a` is a
long-lived daemon that receives marketplace messages and dispatches them to the
configured AI provider.

## Required Runner Host

Use a VPS, VM, or other always-on Linux machine. Do not use Vercel functions for
the A2A responder.

Minimum runtime:

- Node.js `>= 22.14.0`
- npm
- authenticated Codex CLI
- authenticated Onchain OS / Agentic Wallet for the ProofArena ASP owner
- `@okxweb3/a2a-node`

ProofArena currently uses:

- Node 24 for the Next.js/Eve app
- Node 23 for the OKX `okx-a2a` CLI

## Bootstrap

From the host:

```bash
git clone https://github.com/N-45div/ProofArena.git ~/proofarena
cd ~/proofarena
./scripts/okx-a2a-bootstrap.sh
```

If the host does not already have Codex authenticated, sign in there first. The
runner must be able to execute the configured provider command without an
interactive login prompt.

## Systemd

Install the service template:

```bash
mkdir -p ~/.config/systemd/user
cp ops/okx-a2a-runner.service ~/.config/systemd/user/proofarena-okx-a2a.service
systemctl --user daemon-reload
systemctl --user enable --now proofarena-okx-a2a.service
loginctl enable-linger "$USER"
```

Health checks:

```bash
okx-a2a daemon status
okx-a2a doctor --non-interactive
okx-a2a task requests --json --timeout-ms 10000
```

Expected state:

- daemon is running
- doctor has zero failures
- agent refresh sees `agentCount >= 1`
- no pending verification task is stuck unanswered

## Resubmission Rule

After the runner is healthy, resubmit the OKX.AI listing from the agent
conversation interface or Onchain OS. If rejection repeats, check the runner
logs first; do not change the Vercel app unless the proof-card API itself is
failing.
