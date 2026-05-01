---
name: preview
description: Start the support-hub dev server (Astro Starlight on port 3300) and open it in Chrome. Idempotent — kills any stale instance first.
---

Start the dev server and open the support hub in Chrome.

Follow these steps:

1. Always kill and restart fresh (ensures latest code, no stale state):
   - `lsof -ti:3300 | xargs -r kill 2>/dev/null`
   - Wait 1 second.
2. Start `pnpm dev` in the background from the repo root. Astro serves the Starlight site on port 3300.
3. Poll until it responds. Retry every second for up to 15 seconds:
   - `curl -sS -o /dev/null -w "%{http_code}" http://localhost:3300` → 200
4. Run `open -a "Google Chrome" http://localhost:3300` to open it specifically in Chrome. If Chrome isn't installed the command exits non-zero — fall back to plain `open http://localhost:3300` and tell the user Chrome wasn't found.
5. Tell the user: the support hub is at http://localhost:3300. Mention that `pkill -f astro` (or letting the session end) stops it.

Do NOT ask which page to open — default to the root. Keep output short.

## If MCP can't reach localhost

If the Claude-in-Chrome MCP tab returns `chrome-error://chromewebdata/` with `ERR_CONNECTION_REFUSED` for `http://localhost:3300/` while `curl` and the user's main Chrome reach it fine, the extension is silently aborting loopback navigations from automated tabs (a known constraint, confirmed 2026-04-30 in the dashboard repo). Don't loop.

Fall back to the LAN IP for any MCP-driven step that follows:

```
ipconfig getifaddr en0   # → e.g. 192.168.86.141
```

Pass `http://<that-ip>:3300/...` to MCP `navigate` instead of `localhost`. The astro config here is set to `host: true` so it serves both. The user's main Chrome keeps using `localhost`.
