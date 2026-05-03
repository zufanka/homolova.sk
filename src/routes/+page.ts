import { listPosts } from '$lib/posts';
import { SITE_TITLE, SITE_DESCRIPTION } from '$lib/site';

export const load = () => ({
  posts: listPosts(),
  meta: {
    ogTitle: SITE_TITLE,
    ogDescription: SITE_DESCRIPTION,
    ogType: 'website' as const,
    canonical: '/'
  }
});
