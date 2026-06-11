---
description: Find all TypeScript errors and fix them one by one
allowed-tools: Bash, Read, Edit
---

Find and fix all TypeScript errors in the GROWTH app.

Steps:

1. Run `npx tsc --noEmit 2>&1` and capture the output.

2. If zero errors — report success. Done.

3. For each error:
   a. Read the file at the reported path + line number.
   b. Understand the root cause (wrong type, missing prop, `any` used incorrectly, etc.).
   c. Apply the minimal fix — do not refactor beyond what's needed to satisfy TypeScript.
   d. Prefer explicit types over casting with `as`. Avoid `as unknown as T` hacks.
   e. If the fix requires a new type, add it to `src/types/index.ts` or the relevant types file.

4. After fixing all errors, run `npx tsc --noEmit` again to confirm zero errors.

5. Report: list of files changed + what was wrong in each.

Rules:
- No `any` types.
- No `// @ts-ignore` or `// @ts-expect-error` unless the cause is a known upstream type gap (explain it with a comment).
- If a fix would require a large refactor, stop and report the situation to the user instead.
