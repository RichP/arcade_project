## Arcade

A dark-themed web arcade built with Next.js App Router, React, and TypeScript. Features a global NavBar with search and Random, a collapsible left Sidebar with filters, featured carousel, favorites, and optimized images.

## Configuration

Optional but recommended: set your canonical site URL so `sitemap.xml` and `robots.txt` use the correct domain.

1. Copy `.env.local.example` to `.env.local`.
2. Fill in your public URL:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

This value is used by `src/app/sitemap.ts` and `src/app/robots.ts` during build.

## Development

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open http://localhost:3000 to view the app.

## Build

```bash
npm run build
npm run start
```
