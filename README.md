# amaanali.ca

My personal portfolio: a terminal-inspired site with a dark and light theme, project case studies, and a few easter eggs.

**Live:** [amaanali.ca](https://amaanali.ca)

## Stack

- **Next.js 16** (App Router) + **TypeScript**, exported as a fully static site (`output: "export"`)
- Hosted on **Cloudflare Pages**: every push to `main` deploys, every pull request gets a preview URL
- **GitHub Actions** CI: lint, type-check, build, and a check that every route was exported
- No CSS framework: hand-written styles, Google Fonts (Bricolage Grotesque, Hanken Grotesk, JetBrains Mono)

## Pages

| Route | What it is |
| --- | --- |
| `/` | Home: hero terminal, experience pipeline, projects, about (XP-level timeline), contact |
| `/light` | The same page in the light theme (the Dark / Light toggle switches between them) |
| `/projects/gymflow` | GymFlow case study: API map, request lifecycle, ERD, SQL console, trailer video |
| `/projects/rep-theory` | Rep Theory case study: checkout flow tour, architecture, team process |

## Details I like

- **Bot-resistant email.** My address never appears in the HTML. It's assembled in the browser only when someone clicks **reveal**, with a small "decrypt" animation, and then copied to the clipboard.
- **Scroll-spy everywhere.** The sidebar, the right-hand progress rail, and the case-study chapter rail all follow your scroll position.
- **Reduced motion.** Animations respect `prefers-reduced-motion`.

## How it was built

I designed every section on a design canvas first, iterating section by section (hero, nav, experience, projects, about, contact). `tools/dc2tsx.py` converts those canvas pages into React client components (`components/*.tsx`), so the design file stays the single source of truth. Those generated files are excluded from lint and marked `@ts-nocheck`. The hand-written app code (`app/`) is linted and type-checked in CI.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static site in ./out
```

## Deploy (Cloudflare Pages)

| Setting | Value |
| --- | --- |
| Framework preset | Next.js (Static HTML Export) |
| Build command | `npm run build` |
| Build output directory | `out` |
| Node version | from `.node-version` (22) |

---

© 2026 Amaan Ali
