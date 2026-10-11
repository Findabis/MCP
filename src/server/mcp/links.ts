import { absoluteUrl } from '@/utils/jsonLd/shared';

/**
 * Links the public MCP hands a model. Absolute and canonical — built from
 * `BASE`, the same origin llms.txt, the sitemap and JSON-LD use — because a
 * model quotes them to a person, and `findabis.com/x` without a scheme is
 * not a link in most chat clients.
 *
 * Always the slug, never the row id: an id URL is not the canonical page and
 * leaks an identifier the tools otherwise never show. No slug, no link.
 */
export type ListingKind = 'clinic' | 'pharmacy' | 'product' | 'strain' | 'brand';

const SECTION: Record<ListingKind, string> = {
    clinic: 'clinics',
    pharmacy: 'pharmacies',
    product: 'products',
    strain: 'strains',
    brand: 'brands',
};

export function pageUrl(kind: ListingKind, slug: string | null | undefined): string | null {
    const clean = slug?.trim();
    return clean ? absoluteUrl(`/${SECTION[kind]}/${encodeURIComponent(clean)}`) : null;
}

/** A site path or an already-absolute CDN URL (images, documents), as an absolute URL */
export const siteUrl = (path: string | null | undefined): string | null => (path ? absoluteUrl(path) : null);

/** The text line for a link, or nothing when there is no canonical page */
export const linkLine = (url: string | null) => (url ? `\n  ${url}` : '');
