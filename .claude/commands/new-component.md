---
description: Scaffold a new React component for the GROWTH app with the correct patterns
allowed-tools: Read, Write, Bash
argument-hint: "ComponentName [description of what it does]"
---

Create a new React component for the GROWTH app.

Component name: $ARGUMENTS

Steps:

1. Determine if this is a client component (has user interaction, uses hooks, handles events) or a server-fetching component. Most UI components are client.

2. Read `src/lib/domains.ts` and `src/lib/lang.tsx` briefly to understand the patterns.

3. Create the file at `src/components/<component-name-in-kebab-case>.tsx` using this template:

```tsx
'use client'

import { useLang } from '@/lib/lang'

interface <ComponentName>Props {
  // define props here
}

export function <ComponentName>({ }: <ComponentName>Props) {
  const { t, isRTL } = useLang()

  return (
    <div>
      {/* content */}
    </div>
  )
}
```

4. Follow these rules:
   - Named export (not default)
   - Use `useLang()` if the component has any text
   - Use inline `style={{}}` for any domain-specific or dynamic oklch colors, never Tailwind interpolation
   - All touch targets at least 44px height
   - Cards use: `background: oklch(0.12 0.04 238)`, `border: 1px solid oklch(0.75 0.12 210 / 14%)`, `border-radius: 1.25rem`
   - Ocean cyan for interactive/highlight elements: `oklch(0.75 0.17 205)`

5. After creating, run `npx tsc --noEmit` to verify no TypeScript errors.

6. Tell the user where the file was created and how to import it.
