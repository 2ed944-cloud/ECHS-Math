# ECHS Math Tutor — Cloudflare Workers AI

This directory contains the protected backend for the ECHS Math Tutor. The browser never receives a Cloudflare API token. The Worker uses the Workers AI binding directly.

## Deploy

1. Create or sign in to a Cloudflare account.
2. Install Node.js and Wrangler locally.
3. From this directory run:

```bash
npm install -g wrangler
wrangler login
wrangler deploy
```

Wrangler prints a URL similar to:

```text
https://echs-math-tutor.<account>.workers.dev
```

## Connect the portal

Edit `js/echs-ai-tutor-config.js`:

```js
window.ECHS_AI_TUTOR_CONFIG = Object.freeze({
  enabled: true,
  endpoint: "https://echs-math-tutor.<account>.workers.dev",
  title: "ECHS Math Tutor",
  welcome: "أخبرني ما الذي تحاول فهمه في الدرس الحالي.",
  maxHistoryMessages: 8,
});
```

Then include the following in any portal or lesson page:

```html
<link rel="stylesheet" href="css/echs-ai-tutor.css">
<script src="js/echs-ai-tutor-config.js"></script>
<script src="js/echs-ai-tutor.js" defer></script>
```

For pages in nested folders, adjust the relative paths.

## Production safeguards included

- Only the configured GitHub Pages origin is accepted.
- Messages and history are length-limited.
- The system prompt confines the assistant to school mathematics.
- The tutor starts with hints and progressive explanations.
- It does not award mastery or treat chat as assessment evidence.
- It avoids giving direct final answers when a student identifies an active graded or timed assessment.
- The frontend remains disabled until a real Worker URL is configured.

## Important limitations

The Cloudflare free allowance is limited, not unlimited. Configure Cloudflare usage notifications and do not enable paid overages unless the school approves them. AI responses can contain mathematical errors and must not replace teacher judgment or verified answer keys.
