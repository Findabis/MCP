import { z } from 'zod';
import { linkLine, pageUrl } from '@/server/mcp/links';
import type { PublicMcpTool } from '@/server/mcp/registry';
import { summarise } from '@/server/mcp/registry';
import { publicCaller } from './caller';
import { CATEGORIES } from './catalogue';
import { brandListOutput, type brandRow } from './outputs';
import { limitInput, offsetInput, readWindow } from './paging';
import { toolCopy } from './summary';

type BrandRow = z.infer<typeof brandRow>;

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);

export function toBrandRow(b: any): BrandRow {
    return {
        name: String(b.name ?? ''),
        slug: str(b.slug),
        url: pageUrl('brand', b.slug),
        city: str(b.city),
        country: str(b.country?.name),
        website: str(b.website),
        productCount: Number(b._count?.catalogProducts ?? 0),
    };
}

const brandLine = (r: BrandRow) =>
    `${r.name}${r.slug ? ` [slug: ${r.slug}]` : ''} — ${[r.city, r.country].filter(Boolean).join(', ') || 'location not published'} · ${r.productCount} product${r.productCount === 1 ? '' : 's'}${linkLine(r.url)}`;

export const findBrands: PublicMcpTool = {
    ...toolCopy('find_brands'),
    inputSchema: {
        query: z.string().max(120).optional().describe('Brand name, matched as text. Omit to browse.'),
        category: z
            .enum(CATEGORIES)
            .optional()
            .describe('Only brands with a listed product in this dose form. CARTRIDGE is a vape cartridge.'),
        // Never the website's Featured order: that puts sponsoring brands first, and a model would read it as a ranking
        sort: z
            .enum(['name_asc', 'name_desc', 'products_desc'])
            .optional()
            .describe('name_asc (default), name_desc, or products_desc (most listed products first).'),
        limit: limitInput,
        offset: offsetInput,
    },
    outputSchema: brandListOutput,
    scopes: ['public'],
    handler: async ({ query, category, sort = 'name_asc', limit = 10, offset = 0 }, ctx) => {
        const api = await publicCaller(ctx);
        const search = query?.trim() || undefined;
        const res = await readWindow<any>(offset, limit, (page, perPage) =>
            api.brand.getPagedBrands({ search, category, sort, page, perPage }),
        );
        const results = res.items.map(toBrandRow);
        const text = summarise(results.map(brandLine), res.total, 'Narrow with `query` or `category`.', offset);
        const next = results.length
            ? '\nNext: get_listing kind=brand slug=… for one brand, or find_products query=<brand> for its products.'
            : '';
        return { text: `${text}${next}`, structured: { results, total: res.total } };
    },
};
