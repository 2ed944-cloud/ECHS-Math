# Low-cost launch architecture

## Launch objective

Run the autonomous school-sales system without paying for infrastructure that is not yet justified by revenue.

## Default topology

```text
Dedicated WhatsApp number
        │
        ▼
One macOS/Linux Desktop computer
        │
        ├─ OpenClaw Gateway
        ├─ WhatsApp channel
        ├─ Chrome + Google Meet
        ├─ local workspace / memory
        └─ sales agents
             ├─ Luna: routine WhatsApp / qualification
             ├─ Terra: meetings / complex sales
             └─ Sol: internal high-stakes review only
```

No VPS is required for launch.
No n8n is required for launch.
No second meeting computer is required for launch.
No paid TTS provider is required for launch.
HubSpot is optional during the first smoke-test stage.

## Model authentication

Preferred launch path: ChatGPT/Codex OAuth subscription auth.

```bash
openclaw models auth login --provider openai
openclaw models list --provider openai
```

OpenClaw supports OpenAI subscription OAuth for external workflows. Use the exact model tiers exposed by the signed-in account. The launch config expects Luna, Terra and Sol; if one tier is not exposed, do not guess — adjust the config to the verified list.

### Routing policy

- Luna: ordinary WhatsApp conversation, qualification, scheduling, routine FAQ and follow-up.
- Terra: Google Meet, meeting preparation, complex objections, demo strategy and normal negotiation.
- Sol: no customer channel binding. Internal review only for high-value, unusual or high-risk deals.

The purpose is not merely fallback reliability. It prevents expensive/high-capability reasoning from being consumed on trivial turns.

## Meeting speech cost

The launch config uses Microsoft neural TTS, which does not require an API key. It is best-effort and has no SLA; upgrade to OpenAI or ElevenLabs only after sales data shows the value.

Google Meet `agent` mode still requires a realtime transcription provider. The reliable launch choice is an OpenAI project-scoped API key used for transcription. Keep a small budget/alert and do not use that key for ordinary reasoning if subscription OAuth is working.

## Hardware

The same machine can run Gateway and Chrome audio when it is a supported desktop OS:

### macOS
- BlackHole 2ch
- SoX
- Chrome
- computer prevented from sleeping during availability hours

### Linux Desktop
- PipeWire-Pulse
- pactl/pacat/parec
- Chrome
- run OpenClaw as the same desktop user that owns the audio session

Windows can run OpenClaw, but the current Google Meet Chrome talk-back path should use a supported macOS/Linux desktop host.

## Availability

The local-first architecture is available only while the computer is powered on, connected to the internet and not sleeping. This is acceptable for validation and early selling. Move to an always-on host only after real revenue or missed-lead data justifies it.

## CRM

Do not make HubSpot a release blocker. OpenClaw session memory and structured meeting summaries are enough for the first smoke tests. Once the sales flow is proven, complete the free HubSpot onboarding and connect the pipeline described in `integrations/CRM_BLUEPRINT.md`.

## Payments

Stripe has no launch-time monthly infrastructure requirement in this design. Do not create live payment products until:
- seller identity is verified;
- prices are approved;
- commercial terms are approved.

For B2B schools, keep both routes available:
- hosted payment/checkout for simple pilot purchases;
- quote/invoice/PO/bank-transfer path for procurement-led schools.

## Upgrade triggers

Add a VPS or dedicated always-on node only when at least one is true:
- the local computer cannot stay online reliably;
- inbound leads are being missed outside availability hours;
- multiple meetings collide with normal computer use;
- revenue already covers the operating cost comfortably;
- a school requires stronger operational separation.

Add n8n only when deterministic cross-system automation becomes complex enough that OpenClaw + CRM/Stripe integrations are harder to audit than a workflow engine.
