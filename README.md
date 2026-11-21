# DARK DEVTOOLS

**Tools That Make Digital Work Easier.** A free, local-first set of 50 browser utilities for developers, creators, students and everyday users.

## Why React + Vite?

React gives the tool workspace and navigation a reusable component model; Vite keeps local development fast and emits a static site with route-level splitting. This is a better fit for a collection of shared workspaces and many focused tools than maintaining 50 unrelated pages. Tool processing uses browser APIs and does not require an application backend.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Install and run

```sh
npm ci
npm run dev
```

## Checks and production build

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

The build runs `scripts/generate-seo.mjs` before TypeScript and Vite. Set `SITE_URL` to the final HTTPS origin before building to generate an absolute `sitemap.xml` and canonical URLs:

```powershell
$env:SITE_URL = "https://your-domain.example"
npm run build
```

The value is public site configuration, not a secret. If it is unset, the script writes a permissive `robots.txt` without a sitemap declaration and skips generating `sitemap.xml`.

## What’s included

- React 18, TypeScript strict mode, React Router, Vite
- CSS-variable dark design system, Lucide icons, responsive tool workspace
- Responsive DARK DEVTOOLS logo lockup and compact emblem, multi-size browser/PWA icons, and a brief reduced-motion-aware boot splash
- 50 searchable registry entries in `src/data/tools.ts`, grouped by `src/data/categories.ts`
- Favorites stored locally under `darkdevtools:favorites` (no tool input is persisted)
- Search palette (`/` or Ctrl/Cmd+K), category filtering, favorites, toast feedback
- Browser-local utilities, Web Crypto generators, sanitized Markdown, QR output, and an isolated HTML preview frame
- Vercel SPA rewrite and response security headers

## Project structure

```text
src/
  app/          Routes, pages, shared tool workspace
  components/   Cards, navigation, search palette, toasts
  data/         The tool registry and category metadata
  hooks/        Favorites and toast hooks
  tools/        Shared tool logic and tests
  utils/        Search ranking
  workers/      Isolated regular-expression worker
  styles/       Design tokens, reset and component styles
scripts/        Build-time robots/sitemap generator
public/         Favicon, manifest, OG art, generated robots/sitemap
```

## Add or change a tool

1. Add an entry to `src/data/tools.ts`, including a unique ID/slug, category, plain-language description, keywords, icon, related IDs and usage steps.
2. Add or extend the tool’s processing case in `src/tools/engine.ts`; keep risky or expensive operations isolated (the regex worker is an example).
3. Add the required input/options in `src/app/ToolPage.tsx` and an example in `toolExamples`.
4. Add or extend a focused `*.test.ts` file for pure logic and important edge cases.
5. Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run build`; exercise the tool in the browser before calling it tested.

## Deployment to Vercel

1. Push this folder as a Git repository and import it into Vercel.
2. Use the default Vite settings: install `npm ci`, build `npm run build`, output directory `dist`.
3. Set `SITE_URL` to the site’s actual HTTPS origin in the Vercel project environment, then redeploy so canonical URLs and the sitemap use the real domain.
4. Review the headers in `vercel.json`, especially the sandboxed HTML Playground policy, before making security-policy changes.
5. Verify direct navigation to a tool route, the generated sitemap/robots file, and the deployed headers.

This project has **not** been deployed.

## Known limitations

- This is a client-rendered SPA. Routes get runtime metadata and JSON-LD, but build-time HTML prerendering is not included; search crawlers that do not execute JavaScript may see less page-specific content.
- A real production domain was not supplied. Sitemap generation is therefore gated on `SITE_URL`.
- The passphrase list is a small embedded list (the UI reports its actual size), not the 1,000+ word list in the original brief.
- Some tools intentionally provide a basic implementation rather than full standards coverage: cron explains supported syntax and computes upcoming local runs; the JS minifier is conservative and does no variable renaming; HTML/CSS/XML formatting is lightweight; color conversion supports HEX/RGB/HSL and reports HSV/CMYK, but alpha-aware editing and the full palette workflow are incomplete.
- Lighthouse, screen-reader testing, and full manual valid/invalid/empty/copy/reset/mobile checks across all 50 tools have not been completed. See `PROGRESS.md` for verified scope.
- `npm audit --omit=dev` currently reports two moderate React Router v6 advisories. I kept the specified v6 major rather than silently upgrading the stack; run the audit again before deployment and plan a Router v7 upgrade when the project can accept that change.
