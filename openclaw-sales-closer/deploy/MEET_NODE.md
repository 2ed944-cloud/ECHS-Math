# Meet node setup (`sales-meet-node`)

The production meeting path keeps Chrome and audio off the headless VPS. Use an always-on desktop machine for Google Meet participation.

## Supported practical choices

### macOS (recommended for simplest audio setup)

Install OpenClaw and meeting dependencies:

```bash
brew install blackhole-2ch sox
openclaw plugins install npm:@openclaw/google-meet
openclaw plugins enable browser
```

Reboot after installing BlackHole, then verify:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

### Ubuntu/Linux Desktop

Run under the same normal desktop user that runs Chrome. Do not run the node as root or as a headless service without the user's audio session.

```bash
sudo apt update
sudo apt install -y pipewire-audio pulseaudio-utils
systemctl --user --now enable pipewire pipewire-pulse wireplumber
pactl info
command -v pactl pacat parec
openclaw plugins install npm:@openclaw/google-meet
openclaw plugins enable browser
```

## Connect securely to the Gateway

The Gateway must not expose TCP 18789 publicly. Prefer a private Tailscale network between the VPS and Meet node, or another authenticated private tunnel.

On the Meet node, pair/install the node with display name exactly:

```text
sales-meet-node
```

Then approve the pending device/node on the Gateway and confirm the node advertises:

```text
browser.proxy
googlemeet.chrome
```

The sales config permits only those two remote-node commands for this meeting path.

## Chrome identity

Create a dedicated Chrome/OpenClaw browser profile for platform sales. Sign it into the dedicated Google sales account if you want reliable meeting creation and smoother joins. Do not use a personal Google profile.

## Permissions

Grant Chrome microphone permission to Google Meet. The camera can remain off unless a future sales format requires it.

## Audio verification

From the Gateway, after the node is connected:

```bash
openclaw nodes status --connected
openclaw googlemeet setup --transport chrome-node --mode agent
```

Then use a private test meeting:

```bash
openclaw googlemeet test-listen <MEET_URL> --transport chrome-node
openclaw googlemeet test-speech <MEET_URL> --transport chrome-node
```

Do not allow autonomous customer meetings until both listening and speaking are verified.

## Meeting behavior

The agent must:

1. identify itself as an AI sales specialist;
2. disclose live transcription before substantive discussion;
3. stop transcription if a participant objects;
4. use concise spoken responses;
5. never access real student data during a sales demo;
6. send the synthetic guided demo link instead of sharing private dashboards;
7. summarize agreed next steps immediately after the meeting.

## Recovery

If OpenClaw reports `manualActionRequired`, do not loop/retry. Resolve the browser action (sign-in, admission, microphone permission or Meet dialog), then run setup/test again.

If the node disconnects during a scheduled meeting, the agent should move the buyer to an approved fallback channel (WhatsApp text or a configured phone-call path) rather than inventing that the meeting is still active.
