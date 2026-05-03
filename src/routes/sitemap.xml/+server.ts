import { listPosts, postUrl } from '$lib/posts';
import { SITE_URL } from '$lib/site';

export const prerender = true;

const STATIC_PAGES = ['/', '/hello', '/newsletter'];
const TODAY = new Date().toISOString().split('T')[0];

function urlEntry(loc: string, lastmod: string): string {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;
}

export const GET = async () => {
  const posts = listPosts();

  const staticEntries = STATIC_PAGES.map((path) => urlEntry(`${SITE_URL}${path}`, TODAY)).join(
    '\n'
  );

  const postEntries = posts
    .map((p) => {
      const path = postUrl(p);
      const loc = path.startsWith('http') ? path : `${SITE_URL}${path}`;
      return urlEntry(loc, p.date);
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${postEntries}
</urlset>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
};
