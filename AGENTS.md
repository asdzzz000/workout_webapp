<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

---

# Project Collaboration Rules

## Development Philosophy

This project already has a working architecture.

Do not redesign or rewrite major parts of the application unless explicitly requested.

Prioritize:

* Small changes
* Safe changes
* Incremental improvements
* Verifiable results

---

## Before Making Changes

Before modifying code:

1. Explain the current implementation briefly.
2. Identify the files that will be modified.
3. Propose a short implementation plan.
4. Wait for confirmation if the change is large or high-risk.

---

## After Making Changes

Always provide:

* Modified files
* What was changed
* Why the change was made
* Potential side effects
* How to test the change

---

## Scope Control

Only modify files directly related to the requested task.

Avoid unrelated refactors.

Avoid changing multiple systems in a single task.

---

## Database Rules

Do not modify database schema unless explicitly requested.

Do not rename tables, columns, or relations without approval.

Do not introduce breaking database changes automatically.

---

## API Rules

Do not redesign API structure unless explicitly requested.

Prefer keeping existing API behavior stable.

Documentation should match implementation.

---

## Refactoring Rules

Avoid large-scale refactoring.

Avoid moving files solely for stylistic reasons.

Avoid introducing new architectural patterns unless necessary.

Prefer improving existing code over replacing it.

---

## TypeScript Rules

Prefer improving type safety.

Avoid introducing new `any` types.

Reuse existing shared types whenever possible.

---

## Verification

When possible:

* Run lint checks
* Run build checks
* Verify affected functionality
* Provide a testing plan for every code change
Never claim code works without explaining how it was verified.
