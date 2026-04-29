---
name: audit-claims
description: Audit factual claims in support-hub articles against authoritative sources, surface drift, and produce a triage report. Never edits user-facing copy or any registry without explicit confirmation.
user-invocable: true
argument-hint: [filter — e.g. "stale", "regulatory", a claim id, or empty for all]
---

# Audit Claims

Verify that the factual claims made in the Fledge support hub are still backed by their authoritative sources, and that the article text still matches what the registry expects.

## Background

The support hub has a public-facing surface that makes claims about regulations, processing timelines, HIPAA scope, sub-processors, retention periods, and similar things that drift over time. The source of truth for the audit is a registry at `src/lib/claims/registry.json` (schema at `src/lib/claims/registry.schema.json`).

The registry is anchored to article text by **literal substrings**, not by IDs embedded in the MDX files. Each claim's `appearsIn[].anchor` is a verbatim substring of an article. The registry pulls toward the content; articles are not modified to point at the registry. This means the audit skill enforces **two directions of drift**:

1. **App-side drift** — the article text changed but the registry didn't (anchor check)
2. **Source-side drift** — the source URL changed but the registry didn't (canary check)

If the registry doesn't exist yet in this repo, the skill exits with `No registry at src/lib/claims/registry.json — nothing to audit.` and stops. Don't scaffold one without confirmation.

## What this skill does

For each claim in the registry (filtered by `$ARGUMENTS` if provided), run the following checks **in order**, and stop at the first failure for that claim. Aggregate results into a single triage report at the end.

### Check 1 — Anchor check (in-app)

For every entry in `appearsIn`:

- Read the named file with the Read tool
- Confirm the `anchor` substring appears verbatim in the file content
- Whitespace normalization rules: collapse runs of any whitespace to a single space before comparing. **Preserve case, punctuation, and UTF-8 characters** including en-dashes, em-dashes, curly quotes, etc.
- If the anchor is missing → status `ANCHOR_DRIFT`. The article text was probably edited without updating the registry. **Stop checks for this claim.**

### Check 2 — Freshness check

- If `lastVerified` is `null` → status `NEEDS_INITIAL`. Skip the rest of the checks for this claim; it has never been audited.
- If today's date is past `reviewDueAt` → status `STALE`. **Continue to the next check.**
- Otherwise → status `OK_NOT_DUE`. **Stop checks for this claim.** No need to re-fetch sources before they're due — that wastes WebFetch budget.

### Check 3 — Liveness check

For each source in `evidence` (only when status from Check 2 is `STALE`):

- Use `WebFetch` to fetch the URL
- If the request fails (404, 403, hard redirect to a different host, paywall, etc.) → record `SOURCE_BROKEN` for that source. Continue to the next source.

### Check 4 — Canary check

For each source that fetched successfully in Check 3:

- Look for the `canary` substring in the fetched content
- Whitespace normalization: same rules as Check 1
- If found → record `CANARY_OK` for that source.
- If missing → record `CANARY_DRIFT`. Capture an excerpt of the surrounding context from the new page (~200 characters around where the canary used to be) so a human reviewer can compare.

## Aggregating per-claim status

A claim's overall status after all four checks is the **worst** status across its sources, by this priority (most critical first):

1. `ANCHOR_DRIFT` — registry is out of sync with the article
2. `CANARY_DRIFT` — source page content changed; the claim may no longer be supported
3. `SOURCE_BROKEN` — source URL is unreachable
4. `STALE` (with at least one source still confirming via canary) — re-verify; bumping `lastVerified` is the suggested action
5. `NEEDS_INITIAL` — never verified
6. `OK_NOT_DUE` — no action needed

## Output format

Produce a triage report grouped by status, ordered by priority. For each claim, include:

- Claim id
- Confidence level
- A one-line description of what's wrong
- A one-line **suggested action** (do NOT take it — just suggest)

End the report with the summary line, then **stop**. Do not act on the suggestions without explicit user instruction.

## Important rules

**Never edit files automatically.** This skill produces a report. The user reviews and decides which fixes to apply.

- Do NOT edit `src/lib/claims/registry.json` (e.g. to bump `lastVerified` or update a canary) without explicit per-claim confirmation.
- Do NOT edit any article under `src/content/docs/` without explicit confirmation — these are user-facing copy.
- Do NOT delete a claim from the registry without explicit confirmation.
- If the user confirms an action, make minimal, targeted edits — do not refactor surrounding content.

## Argument handling

- No `$ARGUMENTS` → audit all claims in the registry.
- `$ARGUMENTS = "stale"` → audit only claims past `reviewDueAt`, plus claims with `null` lastVerified.
- `$ARGUMENTS = "regulatory"`, `"process"`, `"format"` → filter by `category`.
- `$ARGUMENTS` matches a claim id exactly → audit only that one claim.

## Operational notes

**WebFetch caching:** The WebFetch tool has a 15-minute cache. If you re-run within 15 minutes you may see stale results. Note this in the report if relevant.

**Parallelism:** When fetching multiple URLs in Check 3, batch them in a single message with multiple WebFetch tool calls in parallel.

**Whitespace normalization helper:** When comparing the canary against fetched content, normalize both sides the same way. Replace all runs of `\s+` with a single space, strip leading/trailing whitespace, then do a case-insensitive substring search.

**PDF sources:** Several primary sources are PDFs. WebFetch returns binary content for these, which can't be canary-checked directly. If a PDF source fails the canary check this way, mark it as `SOURCE_BROKEN` with a note that the PDF was unparseable.
