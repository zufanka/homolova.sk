#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const POSTS_DIR = resolve(ROOT, 'src/content/posts');
const STATIC_DIR = resolve(ROOT, 'static');

const postSlugs = readdirSync(POSTS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

// Map of old-Publii path → destination on the new site.
const redirects = new Map();

// /blog/<slug>/ → /posts/<slug> for every migrated post
// (no trailing slash — site uses `trailingSlash = 'never'`)
for (const slug of postSlugs) {
  redirects.set(`blog/${slug}/index.html`, `/posts/${slug}`);
}
// the one Publii post that didn't migrate
redirects.set('blog/is-craftsmanship-overrated/index.html', '/');
// blog index
redirects.set('blog/index.html', '/');
// the standalone interactive at its old root path
redirects.set('missingvoters/index.html', '/posts/missing-voters');
// dropped Publii pages → CV (closest equivalent)
redirects.set('projects/index.html', '/cv');
redirects.set('portfolio/index.html', '/cv');
redirects.set('hire-me/index.html', '/cv');
redirects.set('mywork/index.html', '/cv');
// dropped → newsletter
redirects.set('stayintouch/index.html', '/newsletter');
redirects.set('newsletter.html', '/newsletter');

function redirectHtml(target) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Redirecting…</title>
<link rel="canonical" href="https://homolova.sk${target}">
<meta http-equiv="refresh" content="0; url=${target}">
<meta name="robots" content="noindex">
<script>location.replace(${JSON.stringify(target)});</script>
</head>
<body><p>Redirecting to <a href="${target}">${target}</a>…</p></body>
</html>
`;
}

let written = 0;
for (const [from, to] of redirects) {
  const out = resolve(STATIC_DIR, from);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, redirectHtml(to));
  written++;
}
console.log(`Wrote ${written} redirect files under ${STATIC_DIR}`);
