import { listPosts, postUrl } from '$lib/posts';
import { SITE_URL, SITE_TITLE, SITE_DESCRIPTION } from '$lib/site';

export const prerender = true;

export const GET = async () => {
  const posts = listPosts();

  const postLines = posts
    .map((p) => {
      const url = p.externalUrl?.startsWith('http')
        ? p.externalUrl
        : `${SITE_URL}${postUrl(p)}`;
      return `- [${p.title}](${url}): ${p.summary}`;
    })
    .join('\n');

  const body = `# ${SITE_TITLE}

> ${SITE_DESCRIPTION}

## Posts

${postLines}

## Pages

- [Hello](${SITE_URL}/hello): bio, own projects, teaching, and a chronological client history.
- [Newsletter](${SITE_URL}/newsletter): subscribe page for Hi! It's Ada and The Pond.
- [RSS feed](${SITE_URL}/rss.xml): full-text feed of posts.
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
