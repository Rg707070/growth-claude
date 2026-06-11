---
description: Add a new i18n translation key to lang.tsx in both Hebrew and English
allowed-tools: Read, Edit, Bash
argument-hint: "key_name [Hebrew value] [English value]"
---

Add a new translation key to `src/lib/lang.tsx`.

Key to add: $ARGUMENTS

Steps:

1. Read `src/lib/lang.tsx` to find the `translations` object structure.

2. Find the appropriate section (or add at the end) and insert the new key under both `he:` and `en:` with appropriate values.

   If Hebrew and English values were provided in $ARGUMENTS, use them.
   If only the key name was given, infer sensible Hebrew and English values from the key name and app context.

3. Format: keys are `snake_case`, values are short UI strings.
   Example:
   ```ts
   // in he:
   my_new_key: 'ערך עברי',
   // in en:
   my_new_key: 'English Value',
   ```

4. Run `npx tsc --noEmit` to verify no TypeScript errors.

5. Show the user:
   - The exact key added
   - How to use it: `const { t } = useLang()` then `t('my_new_key')`
