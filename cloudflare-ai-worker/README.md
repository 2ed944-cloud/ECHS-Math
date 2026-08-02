# ECHS Math Tutor Pro — Cloudflare Workers AI

This directory contains the protected backend for the ECHS mathematics tutor. The browser never receives an API token. The Worker calls Cloudflare Workers AI through the `AI` binding.

## What version 3 adds

- Six teaching modes: Hint, Guide me, Full explanation, Check my work, Another method, and Similar practice.
- Course and lesson context from the ECHS portal.
- Topic and complexity classification.
- A mathematical accuracy protocol covering domains, signs, units, theorem conditions, exact/approximate answers, and independent verification.
- A stronger primary reasoning model with an automatic fallback.
- A second reviewer for checking student work, alternative methods, and difficult full solutions.
- AP/IB assessment integrity: when a student identifies an active graded or timed assessment, the tutor gives guidance rather than the final answer.
- KaTeX-compatible output.
- Origin validation, input limits, privacy-conscious logs, and a best-effort per-client rate limit.
- Health information at the Worker root and the chat endpoint at `/chat`.

## Fastest dashboard deployment

1. Open **Cloudflare → Compute → Workers & Pages → echs-math-tutor → Edit code**.
2. Replace all existing Worker code with the complete contents of:

   `cloudflare-ai-worker/src/index.js`

3. Confirm that the Worker has a **Workers AI binding** named exactly:

   `AI`

4. Press **Deploy**.
5. Open the Worker URL. A successful deployment returns JSON containing:

   - `"service": "ECHS Math Tutor Pro"`
   - `"version": "3.0.0"`
   - `"aiBinding": true`

No environment variables are required for dashboard deployment because secure defaults are built into the source. Variables are still supported for later customization.

## Wrangler deployment

```bash
npm install -g wrangler
wrangler login
cd cloudflare-ai-worker
wrangler deploy
```

The included `wrangler.toml` configures:

```text
PRIMARY_MODEL  = @cf/google/gemma-4-26b-a4b-it
FALLBACK_MODEL = @cf/zai-org/glm-4.7-flash
REVIEW_MODEL   = @cf/zai-org/glm-4.7-flash
```

## Optional variables

| Variable | Default | Purpose |
|---|---|---|
| `ALLOWED_ORIGINS` | ECHS GitHub Pages + localhost | Comma-separated browser origins |
| `PRIMARY_MODEL` | Gemma 4 26B A4B | Main reasoning model |
| `FALLBACK_MODEL` | GLM 4.7 Flash | Backup if the main model fails |
| `REVIEW_MODEL` | GLM 4.7 Flash | Independent answer reviewer |
| `ENABLE_REVIEW` | `true` | Turns the second-pass review on/off |
| `RATE_LIMIT_PER_MINUTE` | `12` | Best-effort per-client request limit |
| `MAX_MESSAGE_CHARS` | `3000` | Maximum student message length |
| `MAX_HISTORY_MESSAGES` | `10` | Recent chat messages sent to the model |

## Browser request

```json
{
  "message": "Explain how to integrate x cos(x).",
  "mode": "explain",
  "history": [],
  "context": {
    "course": "AP Calculus AB",
    "lesson": "Integration by Parts",
    "unit": "Techniques of Integration",
    "objectives": ["Use integration by parts", "Verify an antiderivative"]
  }
}
```

Supported modes:

```text
hint | guide | explain | check | alternative | practice
```

## Response metadata

The API returns the student-facing answer plus:

- detected topic and complexity;
- selected teaching mode;
- model used and whether the fallback was needed;
- whether a second mathematical review was completed;
- assessment-support-only status;
- request ID for diagnosing failures.

## Important limitations

This is a stronger tutoring system, not a formal computer-algebra proof engine. Any generative model can still make mathematical errors. Verified course answer keys, teacher judgment, and formal calculation tools remain authoritative. The Cloudflare free allowance is limited, so keep paid overages disabled unless the school explicitly approves them.
