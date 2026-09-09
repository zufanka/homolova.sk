import { render } from 'svelte/server';
import { listPosts, getPost, postUrl, resolvePostImage, type PostSummary } from '$lib/posts';
import { SITE_URL, SITE_TITLE, SITE_DESCRIPTION } from '$lib/site';

export const prerender = true;

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function absolutize(html: string): string {
  return html.replace(/(href|src)="\/([^"]*)"/g, `$1="${SITE_URL}/$2"`);
}

function absoluteUrl(meta: PostSummary): string {
  const url = postUrl(meta);
  return url.startsWith('http') ? url : `${SITE_URL}${url}`;
}

/** The image consumers should treat as this item's featured image:
 * `featuredImage` when set, else the teaser screenshot. Returns an absolute URL. */
function itemImageUrl(meta: PostSummary): string | undefined {
  const resolved = meta.featuredImageUrl ?? resolvePostImage(meta.slug, meta.newsletterImage);
  if (!resolved) return undefined;
  return resolved.startsWith('http') ? resolved : `${SITE_URL}${resolved}`;
}

function renderFull(meta: PostSummary): string {
  const post = getPost(meta.slug);
  if (!post) return '';
  const { body } = render(post.component);
  // Prepend the featured image so feed consumers that just grab "first <img>
  // in the content" (beehiiv among them) pick it instead of an inline chart.
  const img = itemImageUrl(meta);
  const hero = img
    ? `<p><img src="${img}" alt="${escape(meta.title)}" /></p>\n`
    : '';
  return hero + absolutize(body);
}

function renderTeaser(meta: PostFrontmatter): string {
  const url = absoluteUrl(meta);
  const resolved = resolvePostImage(meta.slug, meta.newsletterImage!);
  const img = resolved!.startsWith('http')
    ? resolved!
    : `${SITE_URL}${resolved!.startsWith('/') ? '' : '/'}${resolved}`;
  return `
    <p><a href="${url}"><img src="${img}" alt="${escape(meta.title)}" /></a></p>
    <p>${escape(meta.newsletterTeaser ?? meta.summary)}</p>
    <p><a href="${url}">Read on homolova.sk →</a></p>
  `.trim();
}

function itemHtml(meta: PostSummary): string {
  return meta.newsletterMode === 'full' ? renderFull(meta) : renderTeaser(meta);
}

export const GET = async () => {
  const posts = listPosts();

  const items = posts
    .map((meta) => {
      const url = absoluteUrl(meta);
      const pubDate = new Date(meta.date).toUTCString();
      const html = itemHtml(meta);
      const img = itemImageUrl(meta);
      const media = img
        ? `\n      <media:content url="${img}" medium="image" />` +
          `\n      <enclosure url="${img}" length="0" type="image/jpeg" />`
        : '';
      return `
    <item>
      <title>${escape(meta.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escape(meta.summary)}</description>${media}
      <content:encoded><![CDATA[${html}]]></content:encoded>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escape(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escape(SITE_DESCRIPTION)}</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
};
