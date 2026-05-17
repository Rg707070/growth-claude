---
description: Run TypeScript type-check and report any errors
allowed-tools: Bash
---

Run a TypeScript type-check on the entire project using `npx tsc --noEmit`.

If there are zero errors, report success clearly.

If there are errors, list each one with:
- The file path and line number
- The error message
- A brief explanation of what's wrong

Do not auto-fix anything — just report. Let the user decide what to fix.
