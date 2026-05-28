<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This project runs **Next.js 16.2.6** with **React 19.2.4** and **Tailwind CSS v4**. APIs, conventions, file structure, and caching defaults may all differ from your training data. Before writing routing, server-component, caching, server-action, or Tailwind code:

1. Read the relevant guide in `node_modules/next/dist/docs/`.
2. Heed deprecation notices in build output.
3. There is **no `tailwind.config.js`** — design tokens live in `@theme inline { … }` inside `src/app/globals.css`.
4. There is **no Pages Router** — App Router only. Server components are the default; mark client components with `'use client'`.
5. Do not invent APIs. If you don't know whether a Next.js API exists in this version, check the local docs first.
<!-- END:nextjs-agent-rules -->
