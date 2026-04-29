---
name: tech-debt
description: Hunt for tech debt across the support-hub repo with a scout sub-agent, have a skeptic sub-agent verify each finding is real and the proposed fix is safe, auto-fix the clear low-hanging ones (with build verification), and leave risky / uncertain debt as a triage report at the end of the run for human guidance. Trigger when Matthew asks to "find tech debt," "clean up tech debt," "do a debt sweep," or similar.
user-invocable: true
argument-hint: [optional path or area to focus on, e.g. "src/content/docs/clients" or "src/components"]
---

# Tech debt sweep

Find real tech debt, verify it's real, fix the cheap and obvious cases, and report the rest. Do not commit or push — leave staged for Matthew to review and `/ship`.

`$ARGUMENTS` optionally narrows the sweep to a path. Empty = whole repo.

## What counts as tech debt here

Use judgment. Real debt looks like:

- **Duplicated copy** across articles or components that's begging for a shared snippet (three or more near-identical paragraphs, a stub block copy-pasted into 8+ places that should be a component).
- **Dead content**: orphan articles nothing links to, sidebar entries pointing at empty folders, components no MDX imports, leftover Starlight scaffolding.
- **Frontmatter drift**: missing `description`, missing `lastUpdated`, `sidebar.order` collisions inside one folder, all articles claiming `lastUpdated: <today>` because nobody bothered to date them.
- **Broken or stale internal links**: `href="/old-slug/"` after a folder was renamed, `mailto:` to an address we don't read anymore.
- **Stale comments / TODOs** that reference work already done or contradict the current code.
- **Type holes** in TypeScript or Astro components: `as any`, `!` non-null assertions, untyped props.
- **Drift from the support-hub spec** at `docs/future-phases/support-hub.md` in the dashboard repo (or `docs/archives/` once it ships): e.g. a contact form added that should still be a `mailto:`, an analytics tracker added off-domain, brand tokens replaced with arbitrary hex.
- **Inconsistent patterns**: one article uses `<LinkCard>`, three still use raw markdown links to the same target — superseded pattern.

What does **not** count (do not flag):

- Style, formatting, or wording preferences in article copy.
- Missing memoization in Astro components (Astro builds static; memoization isn't relevant).
- Abstractions for content that appears once or twice.
- The "we're writing this; email admin@fledgepractice.com" stub. It's intentional and short — don't try to "DRY it up" into a component that's used 12 times to save 4 lines each.
- Anything already idiomatic to this repo.

## Steps

### 1. Read the spec

Read the README and `docs/future-phases/support-hub.md` (or `docs/archives/support-hub.md` if it's already shipped) in `~/Desktop/fledge-practice-dashboard` before scouting. Tech debt is defined relative to the support-hub spec, not generic best-practice.

### 2. Scout (sub-agent)

Spawn a sub-agent with the `Agent` tool, `subagent_type: "Explore"`. Prompt it to find candidate tech debt across the area in `$ARGUMENTS` (or the whole repo if empty). Tell it:
- Read the README and the support-hub spec first.
- Apply the "What counts" / "What does not count" lists from this skill.
- Return up to ~15 candidates ranked by impact, in this format per finding:
  - **What**: 1–2 sentence description of the debt
  - **Where**: list of `path:line` references (all occurrences if duplication)
  - **Why it's debt**: why it bites — concrete cost
  - **Proposed fix**: what the cleanup looks like
  - **Risk**: low / medium / high — confidence the fix is safe and the call is right
- Do not write code. Research only.

### 3. Skeptic critique (second sub-agent)

Spawn a second sub-agent with the `Agent` tool, `subagent_type: "general-purpose"`. Pass it the scout's full report. Its job is to **disagree where appropriate**, not to rubber-stamp. Prompt:

- For each finding, independently verify by reading the cited files in full.
- Mark each finding as one of:
  - **Confirmed** — real debt, fix as proposed is safe.
  - **Confirmed-but-fix-is-wrong** — real debt, but the proposed fix has a flaw.
  - **Not actually debt** — explain why.
  - **Real but risky** — debt is real, fix is non-trivial or load-bearing.
- Be specific. "Risky because it touches the homepage" with no further detail is not enough.
- Do not write code.

### 4. Triage and act

Based on the critique:

- **Confirmed, low risk, clear before/after** → fix it.
- **Confirmed-but-fix-is-wrong** → use the skeptic's better fix.
- **Not actually debt** → drop it. Mention briefly in the final report so Matthew sees the call was made.
- **Real but risky** → do not touch. Save for the report at the end.

After every batch of fixes, re-run typecheck + astro check + build and stop on any failure:

```
pnpm tsc --noEmit
pnpm exec astro check
pnpm build
```

If something breaks, revert that specific fix and move it into the "real but risky" bucket with a note about what failed.

### 5. Do NOT commit or push

Leave the changes in the working tree. Matthew will review and run `/ship` himself. This skill is exploratory — the boundary between "cheap fix" and "needs review" is judgment-heavy.

### 6. Final report

Print, in this exact order:

**Fixed (auto-applied):**
For each fix applied:
- `<one-line description>` — files: `<paths>`.

If nothing was auto-fixed, write `None.`

**Dropped (skeptic disagreed):**
For each finding the skeptic rejected:
- `<one-line description>` — `<one-sentence reason>`

If none, omit this section.

**Needs your call (real but risky):**
For each finding parked here:
- **What**: 1–2 sentences
- **Where**: `path:line` references
- **Why it's debt**: concrete cost
- **Why it's risky**: what makes this not a cheap fix
- **Question for you**: the specific decision Matthew needs to make to unblock it

End with a single line: `Run /ship to commit the auto-fixes, or revert specific files first.`

## Style

- No flattery, no cheerful wrap-up. State results.
- Don't pad the report with findings the skeptic killed unless they're useful context.
- Don't auto-fix anything the skeptic flagged as risky.
- If the scout returns nothing real and the skeptic agrees, the report is `No tech debt worth acting on in <scope>.` and stop.
