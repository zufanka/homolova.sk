import { error } from '@sveltejs/kit';
import { getPost, getSlugs, postUrl, resolvePostImage } from '$lib/posts';

export const prerender = true;

export const entries = () => getSlugs().map((slug) => ({ slug }));

export const load = ({ params }: { params: { slug: string } }) => {
  const post = getPost(params.slug);
  if (!post) throw error(404, `no post "${params.slug}"`);
  // An explicit `ogImage` wins; otherwise the newsletter's image stands in, as
  // it did for every post before that field existed; otherwise the featured
  // one. Additive on purpose — a post that sets nothing new keeps exactly the
  // card it had.
  const ogImage =
    resolvePostImage(params.slug, post.meta.ogImage) ??
    resolvePostImage(params.slug, post.meta.newsletterImage) ??
    post.featuredImageUrl;
  return {
    meta: {
      ...post.meta,
      ogTitle: post.meta.title,
      ogDescription: post.meta.ogDescription ?? post.meta.summary,
      ogImage,
      ogType: 'article' as const,
      canonical: postUrl(post.meta)
    },
    component: post.component,
    featuredImageUrl: post.featuredImageUrl,
    heroImageUrl:
      resolvePostImage(params.slug, post.meta.heroImage) ?? post.featuredImageUrl
  };
};
