# ECHS Math Tutor Pro v4 — Cloudflare Workers AI

This directory contains the protected backend for the ECHS mathematics tutor. The browser never receives an API token. The Worker calls Cloudflare Workers AI through the `AI` binding.

## What version 4 adds

- Complete-answer protection: larger response budgets plus one automatic continuation when a response ends because of a token limit, unfinished sentence, unclosed Markdown, or unclosed KaTeX delimiter.
- Automatic KaTeX loading and rendering in the portal, even when the lesson page did not load KaTeX itself.
- Mathematics image input from a file or the clipboard.
- PNG, JPEG, and WebP support with client-side resizing and a default 4 MB server limit.
- Vision instructions for printed questions, handwritten work, graphs, tables, diagrams, and answer choices.
- A vision-capable primary model and a separate vision fallback.
- Six teaching modes: Hint, Guide me, Full explanation, Check my work, Another method, and Similar practice.
- Course and lesson context from the ECHS portal.
- Topic and complexity classification.
- Mathematical accuracy checks for domains, signs, units, theorem conditions, exact/approximate answers, and independent verification.
- AP/IB assessment integrity: when a student identifies an active graded or timed assessment, the tutor gives guidance rather than the final answer.
- Origin validation, input limits, privacy-conscious logs, and a best-effort per-client rate limit.

## Dashboard deployment

The running Cloudflare Worker is not updated merely by merging GitHub changes.

1. Open **Cloudflare → Compute → Workers & Pages → echs-math-tutor → Edit code**.
2. Replace all existing Worker code with the complete contents of:

   `cloudflare-ai-worker/src/index.js`

3. Confirm that the Worker has a **Workers AI binding** named exactly `AI`.
4. Press **Deploy**.
5. Open the Worker URL. A successful deployment returns JSON containing:

```json
{
  "service": "ECHS Math Tutor Pro",
  "version": "4.0.0",
  "aiBinding": true,
  "visionEnabled": true,
  "endpoint": "/chat"
}
```

No environment variables are required for dashboard deployment because safe defaults are built into the source.

## Wrangler deployment

```bash
npm install -g wrangler
wrangler login
cd cloudflare-ai-worker
wrangler deploy
```

The included `wrangler.toml` configures:

```text
PRIMARY_MODEL          = @cf/google/gemma-4-26b-a4b-it
FALLBACK_MODEL         = @cf/zai-org/glm-4.7-flash
VISION_FALLBACK_MODEL  = @cf/meta/llama-4-scout-17b-16e-instruct
REVIEW_MODEL           = @cf/zai-org/glm-4.7-flash
VISION_REVIEW_MODEL    = @cf/google/gemma-4-26b-a4b-it
```

## Optional variables

| Variable | Default | Purpose |
|---|---|---|
| `ALLOWED_ORIGINS` | ECHS GitHub Pages + localhost | Comma-separated browser origins |
| `PRIMARY_MODEL` | Gemma 4 26B A4B | Main text and vision model |
| `FALLBACK_MODEL` | GLM 4.7 Flash | Text fallback |
| `VISION_FALLBACK_MODEL` | Llama 4 Scout | Vision fallback |
| `REVIEW_MODEL` | GLM 4.7 Flash | Text answer reviewer |
| `VISION_REVIEW_MODEL` | Gemma 4 26B A4B | Reviewer when an image is attached |
| `ENABLE_REVIEW` | `true` | Enables second-pass review |
| `RATE_LIMIT_PER_MINUTE` | `12` | Best-effort request allowance; images count as two |
| `MAX_MESSAGE_CHARS` | `3000` | Maximum student message length |
| `MAX_HISTORY_MESSAGES` | `10` | Recent chat messages sent to the model |
| `MAX_IMAGE_BYTES` | `4000000` | Maximum decoded image size |

## Text request

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

## Image request

The browser sends a compressed image as a data URL:

```json
{
  "message": "Check my handwritten solution and identify the first error.",
  "mode": "check",
  "image": {
    "name": "solution.webp",
    "mimeType": "image/webp",
    "dataUrl": "data:image/webp;base64,..."
  },
  "history": [],
  "context": {
    "course": "AP Calculus AB",
    "lesson": "Integration by Parts"
  }
}
```

Supported modes:

```text
hint | guide | explain | check | alternative | practice
```

## Response metadata

The API returns the answer plus:

- detected topic and complexity;
- selected teaching mode;
- whether the image was used;
- whether an automatic continuation completed a truncated answer;
- model used and whether a fallback was required;
- whether a second mathematical review was completed;
- request ID for diagnosing failures.

## Important limitations

The tutor can read clear images, but small labels, blurred handwriting, cropped expressions, and low-contrast graphs may remain ambiguous. It is instructed to say what is unreadable rather than guess. This is a tutoring system, not a formal computer-algebra proof engine. Verified answer keys, teacher judgment, and formal calculation tools remain authoritative. The Cloudflare free allowance is limited; keep paid overages disabled unless the school approves them.
