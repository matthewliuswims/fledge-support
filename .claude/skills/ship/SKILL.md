---
name: ship
description: Typecheck, build, run a sub-agent code review on the agent's own changes, commit only the files the agent edited this session (leaving other working-tree changes alone, since the parent or other agents may be working in parallel), and push to origin. Vercel auto-deploys from `main` on push. Trigger when the user asks to "ship," "push," "deploy these changes," "roll out," or similar.
---

Ship changes end-to-end: verify, review, commit, push. Do not ask questions. Do not ship broken code (failing typecheck or build). The code review is a signal, not a gate — see step 6.

**Ship only the files YOU edited in this conversation.** Multiple agents (and Matthew himself) may be working in parallel; the working tree can contain modifications you didn't author. Bundling someone else's in-progress work into your commit misrepresents the change. Before staging, build a list of the file paths you actually wrote to this session — that list is what gets staged, reviewed, and committed. Everything else stays untouched.

## Steps

1. **Upstream drift check.** Run `git fetch origin`, then `git status`. If output contains "Your branch is behind," stop with: `Ship aborted — local is behind origin. Pull or rebase first, then re-run ship.` Do not auto-merge or rebase.
2. **Identify your files.** Build the list of file paths you (this agent, this session) created or modified. Run `git status --short` to confirm each one shows as modified/untracked. If your list is empty, say `Nothing to ship — I didn't modify any files this session.` and stop. If the working tree contains other modified files you didn't author, note them in one line (`Leaving alone: <paths>`) and continue — do not stage them.
3. **Typecheck.** `pnpm tsc --noEmit`. Stop on any error.
4. **Astro check.** `pnpm exec astro check`. This catches frontmatter-schema errors, broken MDX imports, and content-collection drift that `tsc` won't see. Stop on any error.
5. **Build.** `pnpm build`. Stop on any error.
6. **Code review (sub-agent).** Spawn a sub-agent to review your changes. See "Code review step" below.
7. **Stage + commit.** `git add <your file paths>` — pass the explicit list from step 2, never `git add -A` or `git add .`. Confirm with `git diff --cached --stat` that only your files are staged. Write a short, concrete message (1–2 sentences) describing what actually changed. Plain language. No exclamation points, no flattery. End with a blank line and `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.
8. **Push.** `git push origin HEAD`. If no upstream yet, `git push -u origin HEAD`. Vercel auto-deploys from `main` — production rebuilds within ~30s of the push.
9. **Report.** One line: the commit hash range. If you left other modified files alone, repeat that line here so Matthew sees what's still pending. Then one line per review finding that wasn't cleanly fixed in code, in the format `<severity>: <verbatim one-line Issue> — <fixed inline | disregarded: <brief reason>>`. Omit the per-finding lines only if the review was clean. Don't soften or paraphrase the Issue text.

## Code review step (step 6)

You are the DRI for this ship. The sub-agent review is a second pair of eyes, not a gate. Use judgment — fix what's cheap and clearly right, disregard what isn't pertinent, and only stop if a finding is genuinely disastrous and you can't fix it yourself.

Use the `Agent` tool with `subagent_type: "general-purpose"`. Keep the prompt tight:
- Follow the heuristics in `.claude/skills/codereview/SKILL.md` and use that output format.
- Target is **only the files you modified this session** — pass that explicit list to the sub-agent. Do not ask it to review the whole working tree, since other modified files may belong to a parallel agent or to in-progress human work. For each of your files, the sub-agent should read it in full and diff against HEAD with `git diff HEAD -- <path>`.
- Read the README and the support-hub spec at `docs/archives/support-hub.md` in `fledge-practice-dashboard` for repo-specific constraints (no PHI, brand tokens, content-only).
- Flag only what matters for this change.

After the sub-agent returns, triage the findings:
- **Cheap and clearly right** (broken internal link, typo'd component import, missing frontmatter field) — fix it, re-verify typecheck + astro check + build, keep going.
- **Pertinent but not worth the ship-blocking** (style nits, debatable copy edits, ideas for future work) — disregard, note briefly in the final report if worth remembering.
- **Genuinely disastrous and you can't fix it yourself** (PHI placeholder content, third-party tracker added, contact form that posts user data) — stop. Print the finding verbatim and wait for human input. This bar is high — when in doubt, fix or disregard and keep moving.

Don't paraphrase or soften the sub-agent's findings — whether you fix, disregard, or stop, the user sees the Issue text as written.

## Style

Matthew doesn't want cheerful wrap-ups. State results, nothing else.
