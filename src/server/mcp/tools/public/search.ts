import { z } from 'zod';
import { articleUrl, pageUrl } from '@/server/mcp/links';
import type { PublicMcpTool } from '@/server/mcp/registry';
import { productDisplayName } from '@/utils';
import { plainText } from '@/utils/jsonLd/shared';
import { publicCaller } from './caller';
import { money, num, str } from './clinicRow';
import { searchOutput, type searchRow } from './outputs';
import { toolCopy } from './summary';

type Row = z.infer<typeof searchRow>;
type Card = Record<string, any>;

/**
 * The website's global search: names, links and one line of public facts per
 * hit, so "what is X" needs no second call. Each summary is built field by
 * field from the card the listing page draws — never a price list, stock,
 * a contact or an id. A hit without a slug keeps its name and loses its
 * link: an id URL is not a page the model should hand anyone (links.ts).
 */
const facts = (parts: unknown[]) =>
    parts
        .map((p) => (typeof p === 'string' ? p.trim() : p))
        .filter((p): p is string => typeof p === 'string' && p.length > 0)
        .join(' · ') || null;

const lower = (v: unknown) => str(v)?.toLowerCase().replace(/_/g, ' ') ?? null;
const modes = (types: unknown) => (Array.isArray(types) && types.length ? lower(types.join('/')) : null);
const fee = (v: unknown) => {
    const n = num(v);
    return n != null && n > 0 ? `first consult ${money(n)}` : null;
};
const percent = (label: string, v: unknown) => (num(v) ? `${label} ${num(v)}%` : null);
const count = (n: unknown) => (typeof n === 'number' ? `${n} product${n === 1 ? '' : 's'}` : null);
const slugOf = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);

type Section = {
    key: string;
    kind: Row['kind'];
    label: string;
    name: (c: Card) => string;
    url: (c: Card) => string | null;
    summary: (c: Card) => string | null;
};

const named = (c: Card) => String(c.name ?? '');

const SECTIONS: Section[] = [
    {
        key: 'clinics',
        kind: 'clinic',
        label: 'Clinics',
        name: named,
        url: (c) => pageUrl('clinic', c.slug),
        summary: (c) =>
            facts([
                str(c.city ?? c.town),
                modes(c.consultationTypes),
                fee(c.initialConsultationPrice),
                c.cqcRecord?.rating && `CQC ${lower(c.cqcRecord.rating)}`,
            ]),
    },
    {
        key: 'pharmacies',
        kind: 'pharmacy',
        label: 'Pharmacies',
        name: named,
        url: (c) => pageUrl('pharmacy', c.slug),
        summary: (c) =>
            facts([str(c.city ?? c.town), c.offersDelivery && 'delivers', c.offersCollection && 'collection']),
    },
    {
        key: 'products',
        kind: 'product',
        label: 'Products',
        name: (c) => productDisplayName(c),
        url: (c) => pageUrl('product', c.slug),
        summary: (c) =>
            facts([
                str(c.brand?.name),
                lower(c.category),
                str(c.thcContent) && `THC ${c.thcContent}`,
                str(c.cbdContent) && `CBD ${c.cbdContent}`,
                c.isDiscontinued && 'discontinued',
            ]),
    },
    {
        key: 'strains',
        kind: 'strain',
        label: 'Strains',
        name: named,
        url: (c) => pageUrl('strain', c.slug),
        summary: (c) => facts([str(c.strainType?.name), percent('THC', c.thcContent), percent('CBD', c.cbdContent)]),
    },
    {
        key: 'brands',
        kind: 'brand',
        label: 'Brands',
        name: named,
        url: (c) => pageUrl('brand', c.slug),
        // The card's product count is public (the /brands grid prints it); never a stock figure
        summary: (c) => facts([str(c.country?.name), count(c._count?.catalogProducts)]),
    },
    {
        key: 'blog',
        kind: 'article',
        label: 'Articles',
        name: (c) => String(c.title ?? c.name ?? ''),
        url: (c) => articleUrl(c.slug),
        // The "AI-assisted" label travels with the excerpt, as the article page shows it (DECISIONS E4)
        summary: (c) => facts([str(c.category?.name), c.aiAssisted && 'AI-assisted', plainText(c.excerpt, 140)]),
    },
];

const NEXT =
    '\nNext: get_<kind> slug=<slug> for one in full (get_clinic, get_pharmacy, get_product, get_strain, get_brand, get_article).';

const line = (r: Row) =>
    `  ${r.name}${r.slug ? ` [slug: ${r.slug}]` : ''}${r.summary ? ` — ${r.summary}` : ''}${r.url ? `\n    ${r.url}` : ''}`;

export const searchAll: PublicMcpTool = {
    ...toolCopy('search_directory'),
    inputSchema: {
        query: z.string().min(2).max(120).describe('What to look for: a name, brand, strain, town or postcode.'),
        limit: z.number().int().min(1).max(20).optional().describe('Most results per kind, 1-20. Default 8.'),
    },
    outputSchema: searchOutput,
    scopes: ['public'],
    handler: async ({ query, limit = 8 }, ctx) => {
        const api = await publicCaller(ctx);
        const res: Record<string, unknown> = await api.search.globalSearch({
            query,
            limit,
            countryCode: ctx.countryCode ?? 'GB',
        });
        const results: Row[] = SECTIONS.flatMap((section) => {
            const cards = res[section.key];
            return (Array.isArray(cards) ? (cards as Card[]) : []).slice(0, limit).map((card) => ({
                kind: section.kind,
                name: section.name(card),
                slug: slugOf(card.slug),
                url: section.url(card),
                summary: section.summary(card),
            }));
        });
        const parts = SECTIONS.map(({ kind, label }) => {
            const rows = results.filter((r) => r.kind === kind);
            return rows.length ? `${label}:\n${rows.map(line).join('\n')}` : null;
        }).filter(Boolean);
        return {
            text: parts.length ? `${parts.join('\n\n')}${NEXT}` : `Nothing matched "${query}".`,
            structured: { results },
        };
    },
};
