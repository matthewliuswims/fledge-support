# CLAUDE.md

Guidance for Claude when working in this repo.

This is a static Astro/Starlight content site — no auth, no PHI, no backend. Most work here is editing MDX articles and tweaking sidebar config. See `README.md` for the stack details and local dev commands.

## Browser-extension debugging — surface to Matthew, don't loop

If you're driving the Claude in Chrome extension (e.g. screenshotting the live site, or any logged-in SaaS surface that needs Matthew's session) and hit either of these failure shapes, **stop and tell Matthew** instead of retrying. The extension wedges in ways that look transient but aren't.

1. **`tabs_context_mcp` returns "Browser extension is not connected."** Fully disconnected. `/chrome` → "Reconnect extension" usually fixes it.
2. **First action succeeds, then every subsequent computer/javascript call fails with `Cannot access a chrome-extension:// URL of different extension`.** The insidious one — `tabs_context_mcp`, `find`, `read_page`, and `navigate` keep working, so it looks fine, but no clicks or keystrokes reach the page. `/chrome` reconnect alone often does *not* clear this; the in-process tab is wedged.

**Litmus test before assuming it's working.** Matthew should be able to see the Claude extension panel docked on the right side of his Chrome window. If the panel isn't visible, the extension isn't in a state Claude can drive — full stop, regardless of what `tabs_context_mcp` says.

**The fix when failure shape #2 recurs.** Don't loop, don't try N+1 input strategies. Tell Matthew: *(a)* Cmd+Q the browser entirely, *(b)* relaunch Chrome, *(c)* manually open the Claude extension so the panel is visible on the right, *(d)* tell Claude to retry. After a fresh launch, computer actions reliably take. Per the "Avoid rabbit holes and loops" rule, surface this guidance after 2–3 failed attempts — don't burn turns trying to type into a wedged tab.
