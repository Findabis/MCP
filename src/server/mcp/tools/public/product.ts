import { z } from 'zod';
import { db } from '@/server/db';
import type { PublicMcpTool } from '@/server/mcp/registry';
import { McpToolError } from '@/server/mcp/registry';
import { entityFaqs } from '@/server/utils/seoData';
import { publicCaller } from './caller';
import { type ProductOutput, productOutput, toProductOutput } from './productShape';
import { toolCopy } from './summary';

const money = (amount: number, currency: string) =>
    currency === 'GBP' ? `£${amount}` : `${currency} ${amount.toFixed(2)}`;

function priceLine(range: ProductOutput['priceRange']): string | null {
    if (!range) return null;
    const { min, max, currency } = range;
    const span = min === max ? money(min, currency) : `${money(min, currency)}–${money(max, currency)}`;
    return `Price range across UK pharmacies: ${span}`;
}

/** The typed answer as the one text block a model reads first */
function render(o: ProductOutput): string {
    const strength = [o.thc && `THC ${o.thc}`, o.cbd && `CBD ${o.cbd}`].filter(Boolean).join(' · ');
    const contains = [
        o.carrierOil && `carrier ${o.carrierOil}`,
        o.allergens.length && `allergens: ${o.allergens.join(', ')}`,
        o.capsuleShell && `capsule shell: ${o.capsuleShell}`,
    ].filter(Boolean);
    const lines: (string | null | false)[] = [
        o.name,
        o.discontinued ? 'DISCONTINUED — sellable while stock lasts, no longer produced' : null,
        [o.form, o.brand].filter(Boolean).join(' · ') || null,
        strength && `Strength: ${strength}${o.chemotype ? ` · ${o.chemotype}` : ''}`,
        o.image && `Image: ${o.image}`,
        o.strain &&
            `Strain: ${o.strain.name}${o.strain.genetics ? ` (${o.strain.genetics})` : ''}${o.strain.url ? ` · ${o.strain.url}` : ''}`,
        o.terpenes.length
            ? `Terpenes: ${o.terpenes.map((t) => `${t.name}${t.percent != null ? ` ${t.percent}%` : ''}`).join(', ')}`
            : null,
        contains.length ? `Contains: ${contains.join(' · ')}` : null,
        priceLine(o.priceRange),
        o.withheld,
        o.oilFlowerEquivalence && `Prescription equivalence: ${o.oilFlowerEquivalence}`,
        // The page's "AI-assisted" label travels with the description too
        o.description && `About: ${o.descriptionAiAssisted ? '(AI-assisted) ' : ''}${o.description}`,
        o.dosage && `Dosage: ${o.dosage}`,
        o.storage && `Storage: ${o.storage}`,
        o.documents.length
            ? `Documents: ${o.documents.map((d) => `${d.title} (${d.kind})${d.url ? ` ${d.url}` : ''}`).join('; ')}`
            : null,
        o.faqs.length
            ? // The page's "AI-assisted" label travels with the answer (DECISIONS E4)
              `FAQs:\n${o.faqs.map((f) => `  Q: ${f.question}\n  A: ${f.aiAssisted ? '(AI-assisted) ' : ''}${f.answer}`).join('\n')}`
            : null,
        o.url && `Page: ${o.url}`,
    ];
    return lines.filter(Boolean).join('\n');
}

/**
 * Everything the product page shows an anonymous visitor. The caller carries
 * no session, so getBySlug hands back no listings, no in-stock count and only
 * the public price range (DECISIONS B2), and listForProduct omits
 * patient-only files. The answer is still built field by field
 * (productShape.ts), so nothing restricted can ride along on a spread.
 */
export const getProduct: PublicMcpTool = {
    ...toolCopy('get_product'),
    inputSchema: {
        slug: z
            .string()
            .min(1)
            .max(200)
            .describe('The product page slug from find_products or search_findabis, e.g. "demo-kush-t20-c1".'),
    },
    outputSchema: productOutput,
    scopes: ['public'],
    handler: async ({ slug }, ctx) => {
        const api = await publicCaller(ctx);
        const p: any = await api.catalogProduct
            .getBySlug({ slug, includePharmacyProducts: true, countryCode: 'GB' })
            .catch(() => null);
        if (!p?.id || !p.slug) throw new McpToolError(`No product with slug "${slug}". Use find_products to get one.`);

        // No review score: medicines are not reviewed (DECISIONS E3)
        const [docs, faqs] = await Promise.all([
            api.productDocument.listForProduct({ catalogProductId: p.id }).catch(() => []),
            entityFaqs(db, 'PRODUCT', p.id).catch(() => [] as Awaited<ReturnType<typeof entityFaqs>>),
        ]);
        const structured = toProductOutput(p, docs, faqs);
        return { text: render(structured), structured };
    },
};
