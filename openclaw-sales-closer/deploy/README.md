# Production deployment runbook

This runbook turns the repository sales package into a live OpenClaw sales gateway without exposing the control plane to the public Internet.

## Target architecture

- **VPS:** OpenClaw Gateway, WhatsApp session, model credentials, CRM/payment integrations and persistent sales state.
- **Meet node:** always-on macOS or Linux Desktop machine named `sales-meet-node` running Chrome + native virtual audio. It connects to the Gateway as a paired OpenClaw node.
- **Customers:** contact the dedicated business WhatsApp number, receive a meeting/demo link, and speak to the AI sales specialist.
- **Control UI:** private only through SSH tunnel or Tailscale. Never publish TCP 18789 directly.

## 1. VPS sizing and OS

Use Ubuntu 24.04 or Debian 12 with at least 2 GB RAM; 4 GB is preferred for reliable Docker/image operations. Give the server a dedicated non-personal admin account and SSH key access.

From the checked-out ECHS repository branch:

```bash
bash openclaw-sales-closer/deploy/vps-bootstrap.sh
```

The script creates persistent state, clones OpenClaw, stages the sales workspace/config, generates local Gateway/keyring secrets, enables UFW and leaves port 18789 closed to the public Internet.

## 2. OpenAI API project

Create a dedicated OpenAI API project for this sales agent, add billing/usage limits, and create a project-scoped API key. ChatGPT subscriptions and API billing are separate. Store the key only in the VPS OpenClaw runtime `.env`:

```bash
nano ~/openclaw-runtime/.env
```

Replace:

```text
OPENAI_API_KEY=REPLACE_WITH_OPENAI_PROJECT_KEY
```

Never paste the key into GitHub, WhatsApp, CRM notes, or a sales-agent prompt.

The current agent config uses:

- reasoning/closing model: `openai/gpt-5.6-sol`
- realtime transcription: OpenAI
- TTS model: `gpt-4o-mini-tts`
- voice: `cedar`

## 3. Start/OpenClaw onboarding

On the VPS:

```bash
cd ~/openclaw-runtime
set -a
source .env
set +a

./scripts/docker/setup.sh
```

Use the OpenAI API-key authentication route during onboarding. After setup, re-stage the sales configuration/workspace because onboarding may initialize or modify the default config:

```bash
cp /PATH/TO/ECHS-Math/openclaw-sales-closer/config/openclaw.sales.example.json5 ~/.openclaw/openclaw.json
rm -rf ~/.openclaw/workspace-echs-sales
mkdir -p ~/.openclaw/workspace-echs-sales
cp -R /PATH/TO/ECHS-Math/openclaw-sales-closer/workspace/. ~/.openclaw/workspace-echs-sales/
```

Validate before restart:

```bash
docker compose run --rm openclaw-cli config validate
docker compose up -d openclaw-gateway
docker compose run --rm openclaw-cli doctor --json
```

## 4. Control UI — private access only

Open an SSH tunnel from your computer:

```bash
ssh -L 18789:127.0.0.1:18789 YOUR_VPS_USER@YOUR_VPS_IP
```

Then open `http://127.0.0.1:18789/` locally. Do not add a VPS firewall rule exposing TCP 18789 to the Internet.

## 5. WhatsApp business number

Use a separate SIM/number dedicated to platform sales. Install WhatsApp or WhatsApp Business on that identity, then link OpenClaw once:

```bash
cd ~/openclaw-runtime
docker compose run --rm openclaw-cli plugins install clawhub:@openclaw/whatsapp
docker compose run --rm openclaw-cli channels login --channel whatsapp --account biz
```

Scan the QR using the dedicated sales identity. Verify:

```bash
docker compose run --rm openclaw-cli channels status --probe
docker compose run --rm openclaw-cli agents list --bindings
```

Expected routing: WhatsApp account `biz` -> agent `echs-sales-closer`.

## 6. Google Meet plugin on the Gateway

Install/verify the meeting plugin on the VPS:

```bash
cd ~/openclaw-runtime
docker compose run --rm openclaw-cli plugins install npm:@openclaw/google-meet
docker compose run --rm openclaw-cli plugins enable browser
docker compose run --rm openclaw-cli plugins list | grep -E 'google-meet|browser'
```

The production config intentionally sets `defaultTransport: "chrome-node"`; the VPS itself does not need a desktop/audio session.

## 7. Pair the Meet node

Follow `MEET_NODE.md` on the always-on desktop machine. It must connect under display name `sales-meet-node` and expose both `browser.proxy` and `googlemeet.chrome`.

After pairing, from the Gateway run:

```bash
docker compose run --rm openclaw-cli nodes status --connected
docker compose run --rm openclaw-cli googlemeet setup --transport chrome-node --mode agent
```

Every required setup check should report healthy before allowing autonomous customer meetings.

## 8. Google Meet creation

Preferred: configure Google Meet OAuth so the agent can create meeting URLs through the Meet API. Run the Google Meet auth/setup flow from OpenClaw and store OAuth credentials only in the mounted OpenClaw state/secret store.

Fallback: keep the OpenClaw Chrome profile on `sales-meet-node` signed into the dedicated Google sales account. The plugin can create a Meet through the browser fallback.

## 9. Smoke-test sequence

Do not start with a real school. Test in this order:

```text
A. WhatsApp inbound message from your personal number
B. isolated second sender/session
C. product question
D. refusal to invent price while pricing.configured=false
E. demo URL delivery
F. create test Meet
G. googlemeet test-listen
H. googlemeet test-speech
I. objection simulation
J. end meeting and produce meeting summary
```

Then run all scenarios in `../evals/scenarios.json`.

## 10. Pricing gate

`workspace/commercial/pricing.json` remains `configured:false`. Keep it that way until legal seller name, product name, package prices, floor prices, discount authority and payment terms are approved. The agent must not quote a standard price before this gate is opened.

## 11. Payments

Recommended flow:

```text
Buyer agrees -> agent selects approved SKU -> create/retrieve Stripe Checkout/Payment Link -> send secure link -> payment webhook -> CRM marks CLOSED_WON -> onboarding handoff
```

Use Stripe Checkout for one-time purchases or Stripe Billing + Checkout for recurring annual/monthly plans. Do not store raw card information in OpenClaw.

## 12. CRM/n8n

Use `../integrations/lead.schema.json` as the canonical lead/deal payload. CRM and automation must preserve:

- consent status / `DO_NOT_MARKET`;
- buyer identity and organization;
- stage and next action;
- meeting/proposal/payment state;
- factual questions still awaiting verification;
- source of every commercial commitment.

Do not let automation bypass the pricing or claims registers.

## 13. Go-live gate

Go live only when all are true:

- dedicated sales number is paired and healthy;
- VPS Gateway is private and authenticated;
- OpenAI project key works and has a spend limit;
- Meet node passes listen + speech tests;
- AI/transcription disclosure is spoken;
- demo contains synthetic data only;
- pricing is configured and approved;
- payment path works in test mode, then live mode;
- CRM records opt-out/consent correctly;
- all sales evals pass;
- a human can disable the channel/Gateway immediately if needed.
