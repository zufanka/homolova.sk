import { listPosts, postUrl } from '$lib/posts';
import { SITE_URL, SITE_TITLE, SITE_DESCRIPTION } from '$lib/site';

export const prerender = true;

const STATIC_PAGES = [
  {
    path: '/hello',
    description: 'bio, own projects, teaching, and a chronological client history.'
  },
  {
    path: '/newsletter',
    description: "subscribe page for Hi! It's Ada and The Pond."
  },
  {
    path: '/visualize-cycle',
    description: 'Between the Cycles — an interactive guide through the data visualization cycle.'
  }
];

// Raw markdown sources (frontmatter included) for the full-content dump.
const rawModules = import.meta.glob<string>('/src/content/posts/*/index.{svx,md}', {
  eager: true,
  query: '?raw',
  import: 'default'
});

function slugFromPath(path: string): string {
  const m = path.match(/\/posts\/([^/]+)\/index\.(svx|md)$/);
  return m ? m[1] : '';
}

export const GET = async () => {
  const posts = listPosts().filter((p) => !p.draft);

  const postSections = posts
    .map((p) => {
      const url = p.externalUrl?.startsWith('http')
        ? p.externalUrl
        : `${SITE_URL}${postUrl(p)}`;
      const tags = p.tags?.length ? p.tags.join(', ') : '';
      const header = [
        `# ${p.title}`,
        `- date: ${p.date}`,
        `- url: ${url}`,
        tags ? `- tags: ${tags}` : null
      ]
        .filter(Boolean)
        .join('\n');
      const raw = rawModules[`/src/content/posts/${p.slug}/index.svx`] ??
        rawModules[`/src/content/posts/${p.slug}/index.md`] ?? '';
      return `${header}\n\n---\n\n${raw}`;
    })
    .join('\n\n---\n\n');

  const pageLines = STATIC_PAGES.map(
    (page) => `- [${page.path}](${SITE_URL}${page.path}): ${page.description}`
  ).join('\n');

  const body = `# ${SITE_TITLE}

> ${SITE_DESCRIPTION}

## Posts (full content)

${postSections}

---

## Pages

${pageLines}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
