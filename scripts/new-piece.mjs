#!/usr/bin/env node
/**
 * Scaffold a new standalone interactive piece.
 *
 * Usage: npm run new-piece -- <slug>
 *   e.g. npm run new-piece -- mobile-europeans
 *
 * Creates src/content/posts/<slug>/{index.svx, media/.gitkeep} with frontmatter
 * pre-wired so the piece appears in the homepage feed, RSS, etc., and links
 * out to the static build that you'll drop at static/posts/<slug>/.
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const slug = process.argv[2];
if (!slug) {
  console.error('Usage: npm run new-piece -- <slug>');
  process.exit(1);
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error(`Slug must be kebab-case (lowercase, hyphens). Got: ${slug}`);
  process.exit(1);
}

const root = resolve(process.cwd());
const postDir = join(root, 'src/content/posts', slug);
const staticDir = join(root, 'static/posts', slug);

if (existsSync(postDir)) {
  console.error(`Post folder already exists: ${postDir}`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);

const frontmatter = `---
title: "TODO title"
date: "${today}"
slug: "${slug}"
summary: "TODO short summary used in listings + RSS."
newsletterMode: "teaser"
newsletterImage: "/posts/${slug}/social_preview.jpg"
newsletterTeaser: "TODO short teaser used in the email."
featuredImage: "TODO.jpg"
externalUrl: "/posts/${slug}/"
fullBleed: true
tags: []
---
`;

mkdirSync(join(postDir, 'media'), { recursive: true });
writeFileSync(join(postDir, 'media', '.gitkeep'), '');
writeFileSync(join(postDir, 'index.svx'), frontmatter);

console.log(`Scaffolded ${postDir}`);
console.log('');
console.log('Next steps:');
console.log(`  1. Build your piece with base URL "/posts/${slug}/" baked in.`);
console.log(`     Vite:  vite.config { base: "/posts/${slug}/" }`);
console.log(`     Astro: astro.config { base: "/posts/${slug}/" }`);
console.log('');
console.log(`  2. Drop the build output (index.html + assets/) at:`);
console.log(`     ${staticDir}/`);
console.log('');
console.log(`  3. Drop a featured image into:`);
console.log(`     ${join(postDir, 'media')}/`);
console.log(`     and update featuredImage in the frontmatter.`);
console.log('');
console.log(`  4. Fill in TODO fields in:`);
console.log(`     ${join(postDir, 'index.svx')}`);
