#!/usr/bin/env node
/**
 * One-shot migration: Publii sqlite → src/content/posts/*.svx + static/post-media/
 *
 * Blog posts only (published, not trashed, not is-page). Skips drafts.
 * Post 28 (Let it snow) is handled separately by Let It Snow's custom Svelte component —
 * we emit a thin .svx wrapper and do NOT inline the paragraphs here.
 */

import Database from 'better-sqlite3';
import { mkdirSync, writeFileSync, copyFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(here);
const PUBLII = `${process.env.HOME}/Documents/Publii/sites/hi-im-ada/input`;
const DB = `${PUBLII}/db.sqlite`;
const CONTENT_DIR = join(ROOT, 'src/content/posts');
const MEDIA_DIR = join(ROOT, 'static/post-media');

const LET_IT_SNOW_ID = 28;

const db = new Database(DB, { readonly: true });

const posts = db
  .prepare(
    `SELECT id, title, slug, text, created_at, status
     FROM posts
     WHERE status LIKE '%published%'
       AND status NOT LIKE '%is-page%'
       AND status NOT LIKE '%trashed%'
       AND status NOT LIKE '%draft%'
     ORDER BY created_at DESC`
  )
  .all();

const tagsFor = (postId) =>
  db
    .prepare(
      `SELECT tags.name FROM tags
       JOIN posts_tags ON tags.id = posts_tags.tag_id
       WHERE posts_tags.post_id = ?
       ORDER BY tags.name`
    )
    .all(postId)
    .map((r) => r.name);

const imageFor = (postId) =>
  db.prepare(`SELECT url FROM posts_images WHERE post_id = ? LIMIT 1`).get(postId)?.url ?? null;

const metaDescFor = (postId) => {
  const row = db
    .prepare(`SELECT value FROM posts_additional_data WHERE post_id = ? AND key = '_core'`)
    .get(postId);
  if (!row) return '';
  try {
    return JSON.parse(row.value).metaDesc ?? '';
  } catch {
    return '';
  }
};

function stripUtm(url) {
  // Handles `?utm_…`, `&utm_…`, and HTML-entity `&amp;utm_…` variants.
  return url
    .replace(/(\?|&amp;|&)utm_[^=]+=[^&"'\s]*/g, (match) => (match.startsWith('?') ? '?' : ''))
    .replace(/\?(&amp;|&)/g, '?')
    .replace(/\?$/, '');
}

function beehiivLocalPath(url, postId) {
  // https://media.beehiiv.com/cdn-cgi/image/.../uploads/asset/file/<uuid>/<filename>
  // or https://media.beehiiv.com/uploads/asset/file/<uuid>/<filename>
  const m = url.match(/uploads\/asset\/file\/([^/]+)\/([^"?]+)/);
  if (!m) return null;
  const [, uuid, filename] = m;
  return {
    relUrl: `/post-media/${postId}/beehiiv/${uuid}-${filename}`,
    absFile: join(MEDIA_DIR, String(postId), 'beehiiv', `${uuid}-${filename}`),
    sourceUrl: `https://media.beehiiv.com/uploads/asset/file/${uuid}/${filename}`
  };
}

const beehiivDownloads = new Map(); // absFile → sourceUrl

// Manual slug mapping for old Publii /blog/<slug>/ URLs where the slug changed.
const OLD_SLUG_MAP = {
  '/blog/making-internet-search-your-own/': '/posts/make-search-your-own'
};

function rewriteHtml(html, postId) {
  let out = html;

  // <picture>…<img></picture> → just the <img>. Drops redundant srcsets.
  out = out.replace(/<picture[^>]*>([\s\S]*?)<\/picture>/gi, (_, inner) => {
    const img = inner.match(/<img\b[^>]*>/i);
    return img ? img[0] : inner;
  });

  // Strip srcset/sizes attributes (single-size local files are enough).
  out = out.replace(/\s+srcset="[^"]*"/gi, '');
  out = out.replace(/\s+sizes="[^"]*"/gi, '');

  // Promote Publii's yellow-highlight callouts to blockquotes (semantic, gets our
  // blockquote styling). Must run before the class-strip.
  out = out.replace(
    /<p\s+class="msg[^"]*"[^>]*>([\s\S]*?)<\/p>/gi,
    (_, inner) => `<blockquote><p>${inner}</p></blockquote>`
  );

  // Strip all <span> tags — every span in Publii exports is editor noise
  // (font-weight:400, Publii CSS variables, hash classes). Keeping them causes
  // Svelte's compiler to eat the whitespace at span boundaries, breaking text
  // like "author of<a>…</a>," into "author of<a>…</a>," with no space.
  out = out.replace(/<\/?span\b[^>]*>/gi, '');

  // Hoist section anchor ids from wrapping divs onto the heading that follows,
  // so `<div id="X"><h2>…</h2></div>` becomes `<h2 id="X">…</h2>`. Then strip
  // all divs unconditionally.
  out = out.replace(
    /<div\s+id="([^"]+)"[^>]*>\s*<(h[1-6])>/gi,
    (_, id, h) => `<${h} id="${id}">`
  );
  out = out.replace(/<\/?div\b[^>]*>/gi, '');

  // Strip every class= attribute — they all reference Publii theme CSS that
  // doesn't exist in the new site.
  out = out.replace(/\s+class="[^"]*"/gi, '');

  // Rewrite old /blog/X/ internal links.
  for (const [from, to] of Object.entries(OLD_SLUG_MAP)) {
    out = out.replaceAll(`"${from}"`, `"${to}"`);
  }

  // Drop empty <a> tags (Svelte's a11y check complains).
  out = out.replace(/<a\b[^>]*>\s*<\/a>/gi, '');

  // Hoist whitespace from inside inline elements to the outside. Svelte's
  // compiler trims leading/trailing whitespace inside inline tags, which eats
  // spaces in HTML like `text<a> link</a>` (the leading space inside <a> is
  // dropped, gluing "text" and "link" together).
  const inlineTags = '(?:a|em|i|strong|b|code|u|mark)';
  // leading whitespace
  out = out.replace(
    new RegExp(`(<${inlineTags}\\b[^>]*>)([ \\t]+)`, 'gi'),
    (_, open, ws) => `${ws}${open}`
  );
  // trailing whitespace
  out = out.replace(
    new RegExp(`([ \\t]+)(<\\/${inlineTags}>)`, 'gi'),
    (_, ws, close) => `${close}${ws}`
  );

  // Rewrite beehiiv image URLs.
  out = out.replace(
    /(src|href)="(https:\/\/media\.beehiiv\.com\/[^"]+)"/g,
    (match, attr, url) => {
      const info = beehiivLocalPath(url, postId);
      if (!info) return match;
      beehiivDownloads.set(info.absFile, info.sourceUrl);
      return `${attr}="${info.relUrl}"`;
    }
  );

  // Strip UTM garbage from hrefs. Runs on any href that contains "utm_" — covers
  // the well-formed `?utm_…` case and the junk cases where `&amp;utm_…` was pasted
  // onto a URL that doesn't otherwise have a query string.
  out = out.replace(/href="([^"]*utm_[^"]*)"/g, (_, url) => `href="${stripUtm(url)}"`);

  // Publii DOMAIN placeholder → local post-media.
  out = out.replace(/#DOMAIN_NAME#/g, `/post-media/${postId}/`);

  return out;
}

function toYamlScalar(v) {
  if (v == null) return '""';
  if (Array.isArray(v)) return `[${v.map((x) => JSON.stringify(x)).join(', ')}]`;
  if (typeof v === 'string') return JSON.stringify(v);
  return String(v);
}

function buildFrontmatter(fm) {
  const order = [
    'title',
    'date',
    'slug',
    'summary',
    'newsletterMode',
    'newsletterImage',
    'newsletterTeaser',
    'featuredImage',
    'fullBleed',
    'tags'
  ];
  const lines = ['---'];
  for (const k of order) {
    if (fm[k] == null) continue;
    if (Array.isArray(fm[k])) {
      if (fm[k].length === 0) continue;
      lines.push(`${k}:`);
      for (const item of fm[k]) lines.push(`  - ${JSON.stringify(item)}`);
    } else if (typeof fm[k] === 'boolean') {
      lines.push(`${k}: ${fm[k]}`);
    } else {
      lines.push(`${k}: ${toYamlScalar(fm[k])}`);
    }
  }
  lines.push('---', '');
  return lines.join('\n');
}

function isoDate(createdAt) {
  // created_at is unix ms as integer
  return new Date(Number(createdAt)).toISOString().slice(0, 10);
}

function copyLocalMedia(postId) {
  const src = join(PUBLII, 'media/posts', String(postId));
  if (!existsSync(src)) return;
  const dst = join(MEDIA_DIR, String(postId));
  mkdirSync(dst, { recursive: true });
  for (const entry of readdirSync(src)) {
    if (entry === 'responsive') continue; // Publii's pre-resized copies — not needed
    const srcPath = join(src, entry);
    const dstPath = join(dst, entry);
    const st = statSync(srcPath);
    if (st.isDirectory()) continue; // skip nested dirs like `gallery/`, `babypeacock/`
    copyFileSync(srcPath, dstPath);
  }
}

async function downloadAll(map) {
  if (map.size === 0) return;
  console.log(`\nDownloading ${map.size} beehiiv images…`);
  for (const [dst, url] of map) {
    if (existsSync(dst)) {
      continue;
    }
    mkdirSync(dirname(dst), { recursive: true });
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  FAIL ${res.status} ${url}`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(dst, buf);
    process.stdout.write(`  ${basename(dst)}\n`);
  }
}

function emitStandardPost(p) {
  const date = isoDate(p.created_at);
  const featured = imageFor(p.id);
  const summary = metaDescFor(p.id);
  const tags = tagsFor(p.id);

  const body = rewriteHtml(p.text, p.id);

  const fm = {
    title: p.title,
    date,
    slug: p.slug,
    summary,
    newsletterMode: 'full',
    featuredImage: featured ? `/post-media/${p.id}/${featured}` : undefined,
    tags
  };

  const out = buildFrontmatter(fm) + body + '\n';
  const file = join(CONTENT_DIR, `${p.slug}.svx`);
  writeFileSync(file, out);
  console.log(`  wrote ${p.slug}.svx  (${tags.length} tags, ${body.length}b body)`);
}

function emitLetItSnow(p) {
  const date = isoDate(p.created_at);
  const featured = imageFor(p.id);
  const summary = metaDescFor(p.id) || 'A winter tale from the forest.';
  const tags = tagsFor(p.id);

  const fm = {
    title: p.title,
    date,
    slug: p.slug,
    summary,
    newsletterMode: 'teaser',
    newsletterImage: featured ? `/post-media/${p.id}/${featured}` : undefined,
    newsletterTeaser:
      'A short illustrated story for the winter solstice — best read on the web.',
    featuredImage: featured ? `/post-media/${p.id}/${featured}` : undefined,
    fullBleed: true,
    tags
  };

  const body = `
<script>
  import LetItSnow from '$lib/components/LetItSnow.svelte';
</script>

<LetItSnow />
`;

  const out = buildFrontmatter(fm) + body + '\n';
  writeFileSync(join(CONTENT_DIR, `${p.slug}.svx`), out);
  console.log(`  wrote ${p.slug}.svx  (custom component wrapper)`);
}

// ─── run ────────────────────────────────────────────────────────────────────

mkdirSync(CONTENT_DIR, { recursive: true });
mkdirSync(MEDIA_DIR, { recursive: true });

console.log(`Migrating ${posts.length} posts…`);
for (const p of posts) {
  console.log(`\n→ ${p.id}: ${p.title}`);
  copyLocalMedia(p.id);
  if (p.id === LET_IT_SNOW_ID) emitLetItSnow(p);
  else emitStandardPost(p);
}

await downloadAll(beehiivDownloads);

// Copy let-it-snow videos from media/files.
const filesSrc = join(PUBLII, 'media/files');
const filesDst = join(ROOT, 'static/post-media/files');
if (existsSync(filesSrc)) {
  mkdirSync(filesDst, { recursive: true });
  for (const entry of readdirSync(filesSrc)) {
    const s = join(filesSrc, entry);
    const d = join(filesDst, entry);
    if (statSync(s).isFile() && !existsSync(d)) copyFileSync(s, d);
  }
  console.log(`\nCopied media/files/* → static/post-media/files/`);
}

db.close();
console.log('\nDone.');
