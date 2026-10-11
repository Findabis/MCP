import { z } from 'zod';
import { linkLine, pageUrl } from '@/server/mcp/links';
import type { PublicMcpTool } from '@/server/mcp/registry';
import { summarise } from '@/server/mcp/registry';
import { publicCaller } from './caller';
import { place, ratingOf, stars, str } from './clinicRow';
import { nearInput, nearNote, radiusInput, sites, WIDE_PAGE } from './nearby';
import { pharmacyListOutput, type pharmacyRow } from './outputs';
import { toolCopy } from './summary';

type PharmacyRow = z.infer<typeof pharmacyRow>;

export function toPharmacyRow(p: any): PharmacyRow {
    return {
        name: String(p.name ?? ''),
        slug: str(p.slug),
        url: pageUrl('pharmacy', p.slug),
        city: str(p.city ?? p.town),
        postcode: str(p.postcode),
        distanceMiles: typeof p.distanceMiles === 'number' ? p.distanceMiles : null,
        offersDelivery: Boolean(p.offersDelivery),
        offersCollection: Boolean(p.offersCollection),
        rating: ratingOf(p),
    };
}

export const pharmacyLine = (r: PharmacyRow) =>
    `${r.name}${r.slug ? ` [slug: ${r.slug}]` : ''} — ${place(r)}${stars(r)}${r.offersDelivery ? ' · delivers' : ''}${r.offersCollection ? ' · collection' : ''}${linkLine(r.url)}`;

export const findPharmacies: PublicMcpTool = {
    ...toolCopy('find_pharmacies'),
    inputSchema: {
        query: z.string().max(120).optional().describe('Pharmacy name, matched as text. For a place use `near`.'),
        near: nearInput,
        radiusMiles: radiusInput,
        delivers: z.boolean().optional().describe('Only pharmacies that deliver (most dispense UK-wide by post).'),
        collection: z.boolean().optional().describe('Only pharmacies offering in-person collection.'),
        minRating: z
            .enum(['3_plus', '4_plus'])
            .optional()
            .describe('Only pharmacies with patient reviews averaging 3+ or 4+.'),
        sort: z
            .enum(['distance', 'az', 'za', 'city', 'rating'])
            .optional()
            .describe('distance (default with `near`), az (default otherwise), za, city, rating.'),
        limit: z.number().int().min(1).max(25).optional().describe('How many to return, 1-25. Default 10.'),
    },
    outputSchema: pharmacyListOutput,
    scopes: ['public'],
    handler: async ({ query, near, radiusMiles, delivers, collection, minRating, sort, limit = 10 }, ctx) => {
        const order = sort ?? (near ? 'distance' : 'az');
        const api = await publicCaller(ctx);
        const res: any = await api.pharmacy.getPagedPharmacies({
            search: query?.trim() || undefined,
            countryCode: 'GB',
            perPage: WIDE_PAGE,
            sort: order === 'za' || order === 'city' ? order : 'az',
            ...(near ? { near, radius: radiusMiles } : {}),
            ...(delivers ? { hasDelivery: true } : {}),
            ...(minRating ? { rating: minRating } : {}),
        });
        let rows = sites(res.items ?? [])
            .map(toPharmacyRow)
            .filter((r) => !collection || r.offersCollection);
        if (order === 'rating') rows = [...rows].sort((a, b) => (b.rating?.average ?? 0) - (a.rating?.average ?? 0));
        const results = rows.slice(0, limit);
        const note =
            [
                nearNote(near, res.near),
                Number(res.total ?? 0) > WIDE_PAGE
                    ? `Filters read the first ${WIDE_PAGE} of ${res.total}; add \`near\` or \`query\`.`
                    : null,
            ]
                .filter(Boolean)
                .join(' ') || undefined;
        const hint = results.length
            ? 'Raise `limit` (max 25), or narrow with `radiusMiles` or a filter.'
            : near && radiusMiles
              ? `Try a wider \`radiusMiles\`, or \`delivers: true\` without \`near\`.`
              : 'Drop a filter, or try `delivers: true` without `near`.';
        const next = results.length
            ? '\nNext: get_listing kind=pharmacy slug=… for delivery prices, or compare_providers.'
            : '';
        return {
            text: `${summarise(results.map(pharmacyLine), rows.length, hint)}${note ? `\n${note}` : ''}${next}`,
            structured: { results, total: rows.length, ...(note ? { note } : {}) },
        };
    },
};
