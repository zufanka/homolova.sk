import type { Component } from 'svelte';

export type NewsletterMode = 'full' | 'teaser';
export type PostTag = 'essay' | 'data' | 'fiction';

export interface PostFrontmatter {
  title: string;
  date: string;
  slug: string;
  summary: string;
  newsletterMode: NewsletterMode;
  newsletterImage?: string;
  newsletterTeaser?: string;
  tags?: PostTag[];
  /** Filename of the featured image, resolved against the post's media/ folder. */
  featuredImage?: string;
  /** Hero-block background colour. Any CSS colour. Falls back to site default. */
  accent?: string;
  /** If true, post renders full-bleed without the narrow prose container. */
  fullBleed?: boolean;
  /** Override the "HEY IT'S ADA" wordmark fill colour for this post. Any CSS colour. */
  headerFill?: string;
  /** Fill colour for the post title on its own page. Any CSS colour. Falls back to pink. */
  titleFill?: string;
  /** Background colour for the footer (subscribe bar + site footer) on this post's page. */
  footerBg?: string;
  /** Accent colour for footer links (underline + hover fill). Defaults to pink. */
  footerAccent?: string;
  /** If set, the post is an index-only entry that links out — no /posts/<slug>/ page is rendered. */
  externalUrl?: string;
  /** If true, hide from homepage feed, RSS, and sitemap. The /posts/<slug>/ page
   *  still prerenders and is reachable by anyone with the link — use for sharing
   *  in-progress posts with proofreaders. */
  draft?: boolean;
}

export type LayoutMeta = Pick<
  PostFrontmatter,
  'fullBleed' | 'headerFill' | 'titleFill' | 'footerBg' | 'footerAccent'
> & {
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  canonical?: string;
};

export interface PostModule {
  default: Component;
  metadata: PostFrontmatter;
}

export type PostSummary = PostFrontmatter & { featuredImageUrl?: string };

const modules = import.meta.glob<PostModule>('/src/content/posts/*/index.{svx,md}', {
  eager: true
});

const mediaModules = import.meta.glob<string>('/src/content/posts/*/media/*', {
  eager: true,
  query: '?url',
  import: 'default'
});

function slugFromPath(path: string): string {
  const m = path.match(/\/posts\/([^/]+)\/index\.(svx|md)$/);
  if (!m) throw new Error(`Cannot derive slug from path: ${path}`);
  return m[1];
}

function validate(meta: Partial<PostFrontmatter>, path: string): PostFrontmatter {
  const required: (keyof PostFrontmatter)[] = [
    'title',
    'date',
    'slug',
    'summary',
    'newsletterMode'
  ];
  for (const key of required) {
    if (meta[key] == null) throw new Error(`post ${path}: missing frontmatter "${key}"`);
  }
  if (meta.newsletterMode === 'teaser') {
    if (!meta.newsletterImage || !meta.newsletterTeaser) {
      throw new Error(
        `post ${path}: newsletterMode=teaser requires newsletterImage and newsletterTeaser`
      );
    }
  }
  return meta as PostFrontmatter;
}

export function mediaUrl(slug: string, filename: string): string {
  const key = `/src/content/posts/${slug}/media/${filename}`;
  const url = mediaModules[key];
  if (!url) throw new Error(`Missing media: ${key}`);
  return url;
}

function resolveFeaturedImage(slug: string, filename?: string): string | undefined {
  if (!filename) return undefined;
  if (filename.startsWith('/') || filename.startsWith('http')) return filename;
  return mediaUrl(slug, filename);
}

const all: { meta: PostFrontmatter; mod: PostModule; featuredImageUrl?: string }[] = Object.entries(
  modules
)
  .map(([path, mod]) => {
    const slug = slugFromPath(path);
    const meta = validate(mod.metadata ?? {}, path);
    if (meta.slug !== slug) {
      throw new Error(
        `post ${path}: frontmatter slug "${meta.slug}" does not match folder name "${slug}"`
      );
    }
    return {
      meta,
      mod,
      featuredImageUrl: resolveFeaturedImage(slug, meta.featuredImage)
    };
  })
  .sort(
    (a, b) =>
      b.meta.date.localeCompare(a.meta.date) || a.meta.slug.localeCompare(b.meta.slug)
  );

export function listPosts(): PostSummary[] {
  return all
    .filter(({ meta }) => !meta.draft)
    .map(({ meta, featuredImageUrl }) => ({ ...meta, featuredImageUrl }));
}

export function getPost(
  slug: string
): { meta: PostFrontmatter; component: Component; featuredImageUrl?: string } | null {
  const hit = all.find(({ meta }) => meta.slug === slug);
  if (!hit) return null;
  return {
    meta: hit.meta,
    component: hit.mod.default,
    featuredImageUrl: hit.featuredImageUrl
  };
}

export function getSlugs(): string[] {
  return all.filter(({ meta }) => !meta.externalUrl).map(({ meta }) => meta.slug);
}

export function postUrl(meta: PostFrontmatter): string {
  return meta.externalUrl ?? `/posts/${meta.slug}`;
}
