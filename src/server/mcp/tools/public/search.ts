import { z } from 'zod';
import { type ListingKind, pageUrl } from '@/server/mcp/links';
import type { PublicMcpTool } from '@/server/mcp/registry';
import { productDisplayName } from '@/utils';
import { publicCaller } from './caller';
import { searchOutput, type searchRow } from './outputs';
import { toolCopy } from './summary';

type Row = z.infer<typeof searchRow>;

const SECTIONS: { key: string; kind: ListingKind; label: string }[] = [
    { key: 'clinics', kind: 'clinic', label: 'Clinics' },
    { key: 'pharmacies', kind: 'pharmacy', label: 'Pharmacies' },
    { key: 'products', kind: 'product', label: 'Products' },
    { key: 'strains', kind: 'strain', label: 'Strains' },
    { key: 'brands', kind: 'brand', label: 'Brands' },
];

const slugOf = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);

/**
 * The website's global search, names and links only. A hit without a slug
 * keeps its name and loses its link: an id URL is not a page the model
 * should hand anyone (links.ts).
 */
export const searchAll: PublicMcpTool = {
    ...toolCopy('search_findabis'),
    inputSchema: {
        query: z.string().min(2).max(120).describe('What to look for: a name, brand, strain, town or postcode.'),
        limit: z.number().int().min(1).max(20).optional().describe('Most results per kind, 1-20. Default 8.'),
    },
    outputSchema: searchOutput,
    scopes: ['public'],
    handler: async ({ query, limit = 8 }, ctx) => {
        const api = await publicCaller(ctx);
        const res: any = await api.search.globalSearch({ query, limit, countryCode: 'GB' });
        const results: Row[] = SECTIONS.flatMap(({ key, kind }) =>
            (Array.isArray(res[key]) ? (res[key] as Record<string, any>[]) : []).slice(0, limit).map((item) => ({
                kind,
                name: productDisplayName(item),
                slug: slugOf(item.slug),
                url: pageUrl(kind, item.slug),
            })),
        );
        const parts = SECTIONS.map(({ kind, label }) => {
            const rows = results.filter((r) => r.kind === kind);
            if (!rows.length) return null;
            return `${label}:\n${rows.map((r) => `  ${r.name}${r.url ? ` — ${r.url}` : ''}`).join('\n')}`;
        }).filter(Boolean);
        return {
            text: parts.length ? parts.join('\n\n') : `Nothing matched "${query}".`,
            structured: { results },
        };
    },
};
