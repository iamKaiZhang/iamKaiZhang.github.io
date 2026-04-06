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
- **Node 20+** runtime

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

## German Learning Feature

A standalone, self-contained HTML app at `/public/german-learning/index.html` (served at `/german-learning/`). It is **not** a Next.js page — all HTML, CSS, and JS live in that single file (~1300 lines). Do not apply Next.js conventions to it.

### What it does
- Loads German articles from a GitHub repo (`iamKaiZhang/german-learning`, configurable) or accepts pasted text
- Lets the user highlight text with three annotation types: **word** (yellow), **hard sentence** (red), **comment** (green)
- Saves/loads annotations to `annotations/{slug}.json` in the GitHub repo via the GitHub Contents API
- Requires a GitHub PAT stored in `localStorage` (`gh_pat`) for write access

### Key implementation details
- **State**: `annotations` object (`{ [id]: { id, type, text, note, offset, length } }`), `articleMeta`, `annotationCounter`
- **Annotation offset**: each annotation stores `offset` (character index into `articleBody.textContent`) and `length` for precise re-application after page reload
- **Re-applying saved annotations**: `reapplyAnnotations()` resolves character offsets via `getRangeAtTextOffset()` (TreeWalker over text nodes); falls back to `textContent.indexOf(text)` for older annotations saved without offset
- **Article rendering**: `renderArticle()` parses a simple markdown subset into DOM; annotations are `<mark data-annotation-id="…">` elements wrapping the selected text
- **GitHub API helpers**: `ghGet()`, `ghPut()`, `fetchArticle()`, `saveAnnotationsToRepo()`, `fetchAnnotationsFromRepo()`

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
- **Never open pull requests to the upstream/original forked repository**
- Only push to this repository (`iamkaizhang/iamkaizhang.github.io`)
- Do not add features or refactor beyond what is explicitly requested