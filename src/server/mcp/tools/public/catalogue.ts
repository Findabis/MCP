import { z } from 'zod';
import { publicLatestPriceOn } from '@/server/api/routers/catalogProduct/publicPrices';
import { linkLine, pageUrl } from '@/server/mcp/links';
import type { PublicMcpTool } from '@/server/mcp/registry';
import { summarise } from '@/server/mcp/registry';
import { productDisplayName } from '@/utils';
import { percentRange } from '@/utils/percentRange';
import { publicCaller } from './caller';
import { productListOutput, type productRow, strainListOutput, type strainRow } from './outputs';
import { limitInput, offsetInput, readWindow } from './paging';
import { toolCopy } from './summary';

export const CATEGORIES = ['FLOWER', 'OIL', 'CAPSULE', 'EDIBLE', 'TOPICAL', 'CARTRIDGE', 'HASH'] as const;

/** The strain types the strain pages file under (`strain_types`), as the website's genetics filter matches them */
export const GENETICS = ['Indica', 'Sativa', 'Hybrid'] as const;

/**
 * The MCP caller is anonymous, so the list hands it no per-pharmacy price, no
 * in-stock count and no pack sizes on offer (DECISIONS B2, publicPrices.ts).
 * Rows are built field by field all the same: whatever else a card carries
 * never reaches the model. The line says where the rest is.
 */
const WITHHELD = 'stock and per-pharmacy prices: shown only to patients and professionals with access';

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);

/** The card's "Latest price": public only while the public price switch is on */
function latestPrice(p: any): z.infer<typeof productRow>['latestPrice'] {
    const last = p.lastKnownPrice;
    if (!publicLatestPriceOn() || last?.price == null || Number.isNaN(Number(last.price))) return null;
    return { amount: Number(last.price), currency: str(last.currencyCode) ?? 'GBP' };
}

export function toProductRow(p: any): z.infer<typeof productRow> {
    return {
        name: productDisplayName(p),
        slug: str(p.slug),
        url: pageUrl('product', p.slug),
        brand: str(p.brand?.name),
        category: String(p.category ?? ''),
        thc: str(p.thcContent),
        cbd: str(p.cbdContent),
        discontinued: Boolean(p.isDiscontinued),
        latestPrice: latestPrice(p),
    };
}

function productLine(r: z.infer<typeof productRow>): string {
    const strength = [r.thc && `THC ${r.thc}`, r.cbd && `CBD ${r.cbd}`].filter(Boolean).join(' · ');
    const price = r.latestPrice ? ` · latest price ${r.latestPrice.currency} ${r.latestPrice.amount.toFixed(2)}` : '';
    return `${r.name}${r.brand ? ` (${r.brand})` : ''} — ${r.category.toLowerCase()}${strength ? `, ${strength}` : ''}${r.discontinued ? ' · discontinued' : ''}${price}${linkLine(r.url)}`;
}

export const findProducts: PublicMcpTool = {
    ...toolCopy('find_products'),
    inputSchema: {
        query: z
            .string()
            .max(120)
            .optional()
            .describe('Product, brand or strain name, e.g. "Pink Kush" or "Tilray". Omit to browse.'),
        category: z.enum(CATEGORIES).optional().describe('Dose form. CARTRIDGE is a vape cartridge.'),
        sort: z.enum(['name_asc', 'name_desc']).optional().describe('Alphabetical, name_asc (default) or name_desc.'),
        limit: limitInput,
        offset: offsetInput,
    },
    outputSchema: productListOutput,
    scopes: ['public'],
    handler: async ({ query, category, sort = 'name_asc', limit = 10, offset = 0 }, ctx) => {
        const api = await publicCaller(ctx);
        const search = query?.trim() || undefined;
        const res = await readWindow<any>(offset, limit, (page, perPage) =>
            api.catalogProduct.getPagedWithPricing({ search, category, sort, page, perPage, countryCode: 'GB' }),
        );
        const results = res.items.map(toProductRow);
        const total = res.total;
        const text = summarise(results.map(productLine), total, 'Narrow with `query` or `category`.', offset);
        return { text: results.length ? `${text}\n(${WITHHELD})` : text, structured: { results, total } };
    },
};

export function toStrainRow(s: any): z.infer<typeof strainRow> {
    return {
        name: String(s.name ?? ''),
        slug: str(s.slug),
        url: pageUrl('strain', s.slug),
        genetics: str(s.strainType?.name),
        thcPercent: percentRange(s.thcContent, s.thcContentMax),
        cbdPercent: percentRange(s.cbdContent, s.cbdContentMax),
    };
}

function strainLine(r: z.infer<typeof strainRow>): string {
    const figures = [r.thcPercent && `THC ${r.thcPercent}%`, r.cbdPercent && `CBD ${r.cbdPercent}%`].filter(Boolean);
    return `${r.name}${r.genetics ? ` (${r.genetics})` : ''}${figures.length ? ` — ${figures.join(' · ')}` : ''}${linkLine(r.url)}`;
}

export const findStrains: PublicMcpTool = {
    ...toolCopy('find_strains'),
    inputSchema: {
        query: z.string().max(120).optional().describe('Strain name or nickname, e.g. "Gelato". Omit to browse.'),
        genetics: z.enum(GENETICS).optional().describe('The strain type: Indica, Sativa or Hybrid.'),
        limit: limitInput,
        offset: offsetInput,
    },
    outputSchema: strainListOutput,
    scopes: ['public'],
    handler: async ({ query, genetics, limit = 10, offset = 0 }, ctx) => {
        const api = await publicCaller(ctx);
        const search = query?.trim() || undefined;
        const res = await readWindow<any>(offset, limit, (page, perPage) =>
            api.strain.getPagedStrains({ search, genetics, sort: 'az', page, perPage }),
        );
        const results = res.items.map(toStrainRow);
        const total = res.total;
        return {
            text: summarise(results.map(strainLine), total, 'Narrow with `query` or `genetics`.', offset),
            structured: { results, total },
        };
    },
};
