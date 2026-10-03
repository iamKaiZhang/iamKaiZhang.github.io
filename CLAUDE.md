# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server with Turbopack (http://localhost:3000)
npm run dev

# Run linting
npm run lint

# Run type checking
npm run type-check

# Run tests
npm test

# Build for production
npm run build

# Build and export (for deployment)
npm run predeploy  # This runs 'npm run build' which includes static export

# Analyze bundle size
npm run analyze
```

## Architecture Overview

This is a personal portfolio/resume website built with Next.js and TypeScript, designed to be easily forked and customized.

### Technology Stack
- **Next.js 15.4** with App Router
- **TypeScript** for type safety
- **React 19** with functional components and hooks
- **SCSS** for styling
- **Jest** with React Testing Library and SWC
- **Static Export** for GitHub Pages deployment
- **Node 22+** runtime

### Project Structure
- `/app/` - Next.js App Router pages and layouts
- `/src/components/` - React components organized by feature
- `/src/data/` - Static data files (resume, projects, stats)
- `/src/static/` - SCSS styles
- `/public/` - Static assets (images, favicons)
- `/public/german-learning/index.html` - Standalone German article reader (see below)

### Key Design Patterns
1. **App Router**: File-based routing with layouts
2. **Component Structure**: TypeScript functional components with type safety
3. **Styling**: SCSS modules with shared variables and mixins
4. **Data Management**: Static TypeScript files in `/src/data/`
5. **Performance**: Static export, lazy loading, optimized fonts

### Deployment
- Static export to `/out` directory
- GitHub Actions for automatic deployment to GitHub Pages
- Custom domain support through CNAME file

### Important Notes
- The site uses static export (`output: 'export'`) for GitHub Pages compatibility
- Client components use 'use client' directive
- Google Analytics 4 is configured with NEXT_PUBLIC_GA_TRACKING_ID using @next/third-parties
- Fonts are optimized using Next.js font optimization

## German Learning Feature ("Wortreise")

A standalone static app in `/public/german-learning/` (served at `/german-learning/`). It is **not** a Next.js page: plain HTML, CSS and ES modules, no build step. Do not apply Next.js conventions to it.

### What it does
- Reads and writes the learner's private repo `iamKaiZhang/german-learning` through the GitHub Contents API, using a token stored in `localStorage` (`gh_pat`, `gh_repo`). Without a token it runs on bundled sample data in `demo/` and keeps writes in the browser.
- Screens (hash routes): `#heute` (start), `#lesen` (article list, paste, annotating reader), `#karten` (Anki-style cards over one collection, with filters), `#test` (auto / Claude bank / article tests), `#wiederholen` (Fehlerheft, inbox, grammar, journal), `#fortschritt` (stats, heatmap, passport), `#grammatik/<slug>`, `#einstellungen`.
- A random background scene from `scenes/scenes.json` fills the page on every visit; working screens fade it to a wash.

### Layout
- `index.html` shell, `css/app.css`
- `js/app.js` router · `js/store.js` data layer (github/demo backends, local cache, offline merge) · `js/github.js` API helpers · `js/srs.js` pure scheduling (SM-2 lite, unit-tested in `src/__tests__/wortreise.test.ts`) · `js/md.js` markdown · `js/scenes.js` · `js/sync.js` · `js/cardtext.js` · `js/views/*.js` one module per screen
- `demo/` sample data (same file layout as the learning repo) · `scenes/` background images + `scenes.json` (`file`, `paper`, `focus`, `mfocus`, `place`, `de`, `en`)
- Scene generator: `tools/scenes/` (SVG woodblock prints rendered with Playwright, see its README)

### Data contracts
File formats are defined in the learning repo's `REFERENCE.md` (cards, srs, mistakes, inbox, banks, results, journal, manifest). Keep the app and that document in sync.

### Key implementation details
- **Annotations**: `annotations/<slug>.json` = `{ slug, annotations: [{ id, type: word|hard|comment, text, note, offset, length }] }`. `offset` is a character index into the reader's rendered `textContent`, so `renderArticle()` in `js/md.js` must keep producing exactly the same text (a unit test guards this).
- **Progress writes**: card grades and test results update `review/srs.json` and `review/mistakes.json` in memory, are mirrored to `localStorage`, and are pushed in one batch at the end of a session (or when the page is hidden). Conflicts are merged per sub-card by the later review.

## Owner Preferences

### About This Site
- Personal portfolio website mixing research projects and personal interests
- Forked from an external repository but fully owned and customized by the user
- Live at **zhangkai.io** (custom domain via GitHub Pages)

### Working Style
- **Always ask for confirmation before making any changes** — do not apply edits without explicit approval
- Prefer clean, simple, readable code over preserving the original fork's style
- Batch or increment commits whichever is more token-efficient
- The user will explicitly flag any content or sections that should not be changed

### Hard Rules
- **Don't add or commit unless explicitly requested**
- **Never open pull requests to the upstream/original forked repository**
- Only push to this repository (`iamkaizhang/iamkaizhang.github.io`)
- Do not add features or refactor beyond what is explicitly requested