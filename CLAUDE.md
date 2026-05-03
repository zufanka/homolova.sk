# homolova.sk

Personal data-driven essays by Ada Homolova. Currently a Publii static site at `~/Documents/Publii/sites/hi-im-ada/`; this repo is the SvelteKit replacement.

Site tagline (used in meta tags, RSS, llms.txt, social previews): **"personal data driven essays"**.

## Why we're migrating

The Publii setup has a two-track structure that causes problems:

- Regular blog posts live inside Publii and flow through its theme, RSS, etc.
- Custom interactive pieces (e.g. `missingvoters`) live as standalone static pages in `input/root-files/` — Publii doesn't know they exist. They don't share chrome, aren't in the feed, and can't trigger newsletters.

The goal is one system where a prose essay and a whole-page interactive piece are both just "a post."

## Stack

- **SvelteKit** with `adapter-static` (site is fully prerendered)
- **mdsvex** for Markdown posts that can embed Svelte components inline
- **D3** for visualization
- **Vite** (SvelteKit's default)

### Why SvelteKit and not Astro

Considered both. SvelteKit chosen because:

1. Ada leans toward whole-page interactive pieces (like the existing `missingvoters`) rather than prose-with-inline-chart essays. SvelteKit is native to that shape; Astro's content-site strengths would be underused.
2. One mental model — everything is Svelte, everything runs in the browser, D3 behaves predictably. Lower ongoing cognitive cost for a solo operator.
3. Asymmetric regret: if future posts trend more toward prose, SvelteKit still handles it fine via mdsvex, just shipping ~20kb more JS per page than Astro would. Tolerable. The reverse (Astro, but wanting whole-page interactives) is daily friction.

The cost paid is no zero-JS-by-default and no native content collections — both acceptable tradeoffs for this site.

## Two post shapes

Posts in `src/content/posts/*.svx` (or `.md`), with frontmatter declaring which shape:

- **Prose with embedded charts.** Markdown body, `<Chart />` components dropped inline. Ships the Svelte runtime but charts hydrate normally.
- **Whole-page interactive.** The `.svx` is mostly a title + intro + one big Svelte component that owns the page. Same route convention, same layout chrome.

Both share the site's nav, footer, and typography via a root layout. No more disconnected standalone pages.

## Newsletter workflow (beehiiv)

- **The blog is the source of truth.** Every newsletter issue = a published blog post. No separate newsletter archive — the blog is the archive.
- **beehiiv polls our RSS feed**, creates email drafts from new posts, Ada edits and sends.
- **RSS endpoint is custom** (`src/routes/rss.xml/+server.ts`) and branches on a `newsletterMode` frontmatter field:
  - `full` — emit full HTML content. beehiiv turns it into a real email version of the essay.
  - `teaser` — emit a screenshot + short teaser + "Read on homolova.sk →" link. Used for interactive posts that don't render in email.
- **Screenshot is manual** per post (referenced in frontmatter as `newsletterImage`). Automate with Playwright later if volume justifies it.
- **beehiiv's hosted shadow site is ignored.** Never linked from homolova.sk. Canonical URL in beehiiv settings points to our post. beehiiv is just the send engine.

## Post frontmatter schema

```yaml
title: string
date: ISO date
slug: string                 # URL path
summary: string              # used in listings + RSS
newsletterMode: full | teaser
newsletterImage: string      # required when newsletterMode = teaser
newsletterTeaser: string     # required when newsletterMode = teaser
tags: string[]
```

## Deployment

- **GitHub Pages**, served from a GitHub Actions workflow that builds and publishes `build/` on push to `main`.
- **Custom domain:** `homolova.sk`. Keep the existing `CNAME` file in `static/` so it ends up at the build root.
- **Adapter:** `@sveltejs/adapter-static` with `fallback` unset (fully prerendered site).
- **Base path:** `/` (custom domain, not a project subpath — no `paths.base` config needed).
- **`.nojekyll`** file in `static/` to stop GitHub Pages from processing SvelteKit's `_app/` directory.
- The current Publii `output/` is what's deployed today; post-migration, the GitHub Actions pipeline deploys SvelteKit's `build/` instead.

## Content to migrate from Publii

Existing Publii posts: export → convert to `.md`/`.svx`. Theme (`terminal-override`) is the trickiest part — reimplement as a SvelteKit root layout rather than porting 1:1.

Existing custom pieces to re-home as proper posts (not `root-files/` drops):

- `missingvoters`

Becomes either a `.svx` with an embedded Svelte app, or — if truly standalone — a static drop under `static/posts/<slug>/` (see workflow below).

Other Publii custom pieces (`chartgarden`, `dashboards/mobile_europeans_dashboard`, `slides/*`, `eudatadoolhof`, `dataviz`) are intentionally **not** being migrated.

## Adding a standalone interactive piece

Use this when the piece is its own self-contained app (its own framework, its own build pipeline) and you want it to live alongside the rest of the blog at `/posts/<slug>/` — same URL convention as `.svx` posts, same homepage feed, same RSS.

### One-time per piece

1. **Scaffold the post entry.**
   ```bash
   npm run new-piece -- <slug>
   ```
   Creates `src/content/posts/<slug>/{index.svx, media/}` with frontmatter pre-wired (`externalUrl: "/posts/<slug>/"`, `fullBleed: true`, etc.). Fill in TODO fields.

2. **Build the standalone piece** with `/posts/<slug>/` baked in as the base URL so its own asset paths point correctly.
   - Vite: `defineConfig({ base: "/posts/<slug>/" })`
   - Astro: `defineConfig({ base: "/posts/<slug>/" })`

3. **Drop the build** (`index.html` + `assets/` + any other static files) at `static/posts/<slug>/`.

4. **Drop a featured image** into `src/content/posts/<slug>/media/` and update `featuredImage` in the frontmatter (just the filename — resolved against the `media/` folder).

That's it. The piece appears in the homepage feed and RSS, `/posts/<slug>/` serves the static `index.html` in production (GitHub Pages auto-serves directory indexes) and in `vite dev` (handled by the `serveStaticIndex` plugin in `vite.config.ts`).

### How the routing works

Three pieces cooperate:

- **`postUrl()` in `src/lib/posts.ts`** returns the post's `externalUrl` if set, else `/posts/<slug>`.
- **`PostCard.svelte`** adds `data-sveltekit-reload` to links with an `externalUrl`, so clicking from the homepage triggers a full HTTP request rather than client-side routing into the empty SvelteKit `[slug]` page.
- **`getSlugs()`** in `src/lib/posts.ts` filters out `externalUrl` posts, so the SvelteKit prerenderer doesn't try to generate a competing route. The crawler still encounters the URL while indexing the homepage; `prerender.handleHttpError` in `svelte.config.js` swallows the 404 when a matching `static/<path>/index.html` exists.

In dev, the `serveStaticIndex` plugin in `vite.config.ts` rewrites `/posts/<slug>/` to `/posts/<slug>/index.html` when the static file exists. This mirrors GitHub Pages' production behavior.

## Paths

- This repo: `~/Projects/homolova-sk/`
- Old Publii source (reference only): `~/Documents/Publii/sites/hi-im-ada/input/`
- Old Publii build output: `~/Documents/Publii/sites/hi-im-ada/output/`

## Not yet decided

- Exact directory layout for posts and their assets (images, data files, per-post Svelte components).
- Whether to keep `mdsvex` syntax-highlighting via shiki or prism.
- Image-optimization approach (`@sveltejs/enhanced-img` vs. hand-managed).
- Whether to automate newsletter screenshots at build time.
