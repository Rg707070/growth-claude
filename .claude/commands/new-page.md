---
description: Scaffold a new server page + client companion following GROWTH patterns
allowed-tools: Read, Write, Bash
argument-hint: "route-name [description]"
---

Scaffold a new protected dashboard page for the GROWTH app.

Page route / description: $ARGUMENTS

Steps:

1. Determine the route path (e.g. `analytics` → `src/app/(dashboard)/analytics/`).

2. Create `page.tsx` — async server component:
```tsx
import { createClient } from '@/lib/supabase/server'
import { AnalyticsClient } from './analytics-client'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // fetch data...
  return <AnalyticsClient data={data ?? []} />
}
```

3. Create `[name]-client.tsx` — client component:
```tsx
'use client'

import { useLang } from '@/lib/lang'

interface AnalyticsClientProps {
  data: SomeType[]
}

export function AnalyticsClient({ data }: AnalyticsClientProps) {
  const { t, isRTL } = useLang()

  return (
    <div className="p-4 space-y-4">
      {/* content */}
    </div>
  )
}
```

4. Create `loading.tsx` — skeleton:
```tsx
export default function Loading() {
  return <div className="p-4 animate-pulse space-y-3">
    <div className="h-8 rounded-xl bg-white/5 w-1/3" />
    <div className="h-32 rounded-2xl bg-white/5" />
  </div>
}
```

5. Rules:
   - Auth is handled by the dashboard layout — do NOT re-check in the page.
   - Named export on client component (not default).
   - Pass all data as props from server → client.
   - After mutations in client: call `router.refresh()` (from `useRouter`).
   - Use inline `style={{}}` for any domain-specific colors.
   - Min touch target: 44px height.

6. Run `npx tsc --noEmit` to verify no TypeScript errors.

7. Tell the user the files created and the route path.
