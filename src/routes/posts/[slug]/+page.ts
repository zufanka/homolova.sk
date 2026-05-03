import { error } from '@sveltejs/kit';
import { getPost, getSlugs, postUrl } from '$lib/posts';

export const prerender = true;

export const entries = () => getSlugs().map((slug) => ({ slug }));

export const load = ({ params }: { params: { slug: string } }) => {
  const post = getPost(params.slug);
  if (!post) throw error(404, `no post "${params.slug}"`);
  const ogImage = post.meta.newsletterImage ?? post.featuredImageUrl;
  return {
    meta: {
      ...post.meta,
      ogTitle: post.meta.title,
      ogDescription: post.meta.summary,
      ogImage,
      ogType: 'article' as const,
      canonical: postUrl(post.meta)
    },
    component: post.component,
    featuredImageUrl: post.featuredImageUrl
  };
};
