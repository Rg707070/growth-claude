---
description: Type-check, then commit all staged changes and push to GitHub (triggers Vercel deploy)
allowed-tools: Bash
argument-hint: "commit message"
---

Deploy the current changes to production. Steps:

1. Run `npx tsc --noEmit` — if there are TypeScript errors, STOP and report them. Do not commit broken code.
2. Run `git status` to show what will be committed.
3. If the user provided a commit message as $ARGUMENTS, use it. Otherwise write a short descriptive message based on `git diff --staged`.
4. Run `git commit -m "<message>\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"`.
5. Run `git push`.
6. Confirm success and remind the user that Vercel will auto-deploy in ~1 minute.

If nothing is staged, report that and suggest running `git add <files>` first.
