export const SITE_URL = 'https://homolova.sk';
export const SITE_TITLE = "Hey it's Ada — homolova.sk";
export const SITE_DESCRIPTION = 'personal data driven essays';
export const DEFAULT_OG_IMAGE = '/og/default.png';

export function absoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
