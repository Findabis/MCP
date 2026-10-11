import { z } from 'zod';
import { publicPriceRangeOn } from '@/server/api/routers/catalogProduct/details';
import { pageUrl, siteUrl } from '@/server/mcp/links';
import { productDisplayName } from '@/utils';
import { allergensFor, capsuleShellNote, chemotype } from '@/utils/allergens';
import { getFormulationMedicalLabel } from '@/utils/formulations';
import { plainText } from '@/utils/jsonLd/shared';
import { productForm, publicProductImagePath } from '@/utils/productSeo';

/**
 * `get_product`'s typed answer, built field by field from the product page
 * shape an anonymous caller receives. Nothing here reads a listing, a pack
 * size or a count: the public gets the price range (while
 * FEATURES.PUBLIC_PRICE_RANGE is on) and is told where the rest is.
 */
export const WITHHELD =
    'Stock, pack sizes on offer, and which pharmacies dispense it at what price: shown only to patients and professionals with access';

const nullableText = z.string().nullable();

export const productOutput = {
    name: z.string(),
    slug: z.string(),
    url: z.string().url().nullable(),
    category: z.string(),
    form: nullableText.describe('Dose form as the page labels it, e.g. "Dried flower"'),
    brand: nullableText,
    thc: nullableText,
    cbd: nullableText,
    chemotype: nullableText.describe('THC-dominant, CBD-dominant or balanced, from the cannabinoid figures'),
    discontinued: z.boolean(),
    strain: z.object({ name: z.string(), genetics: nullableText, url: z.string().url().nullable() }).nullable(),
    terpenes: z.array(z.object({ name: z.string(), percent: z.number().nullable() })),
    carrierOil: nullableText,
    allergens: z.array(z.string()),
    capsuleShell: nullableText,
    priceRange: z
        .object({ min: z.number(), max: z.number(), currency: z.string() })
        .nullable()
        .describe('Lowest to highest current price across UK pharmacies, naming none; null when not published'),
    oilFlowerEquivalence: nullableText,
    description: nullableText,
    descriptionAiAssisted: z.boolean(),
    dosage: nullableText,
    storage: nullableText,
    image: z.string().url().nullable(),
    documents: z.array(z.object({ title: z.string(), kind: z.string(), url: z.string().url().nullable() })),
    faqs: z.array(z.object({ question: z.string(), answer: z.string(), aiAssisted: z.boolean() })),
    withheld: z.string(),
};

export type ProductOutput = { [K in keyof typeof productOutput]: z.infer<(typeof productOutput)[K]> };

type Faq = { question: string; answer: string; aiAssisted: boolean };

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);

function priceRange(p: any): ProductOutput['priceRange'] {
    if (!publicPriceRangeOn() || p.minPrice == null || p.maxPrice == null) return null;
    return { min: Number(p.minPrice), max: Number(p.maxPrice), currency: str(p.country?.currencyCode) ?? 'GBP' };
}

type TerpeneRow = { terpene?: { name?: string | null } | null; percentage?: unknown };

function terpenesOf(rows: unknown): ProductOutput['terpenes'] {
    if (!Array.isArray(rows)) return [];
    return (rows as TerpeneRow[]).flatMap((t) =>
        t.terpene?.name
            ? [{ name: String(t.terpene.name), percent: t.percentage == null ? null : Number(t.percentage) }]
            : [],
    );
}

export function toProductOutput(p: any, docs: any[], faqs: Faq[]): ProductOutput {
    const label = getFormulationMedicalLabel(p.category ?? '');
    const form = productForm(p);
    return {
        name: productDisplayName(p),
        slug: String(p.slug),
        url: pageUrl('product', p.slug),
        category: String(p.category ?? ''),
        // productForm falls back to the category label; one of them is enough
        form: form && form !== label ? `${label} · ${form}` : label || null,
        brand: str(p.brand?.name),
        thc: str(p.thcContent),
        cbd: str(p.cbdContent),
        chemotype: str(chemotype(p.thcContent, p.cbdContent, p.thcContentMax, p.cbdContentMax)),
        discontinued: Boolean(p.isDiscontinued),
        strain: p.strain?.name
            ? {
                  name: String(p.strain.name),
                  genetics: str(p.strainType?.name ?? p.strain.strainType?.name),
                  url: pageUrl('strain', p.strain.slug),
              }
            : null,
        terpenes: terpenesOf(p.terpenes),
        carrierOil: str(p.carrierOil),
        allergens: allergensFor(p).map(String),
        capsuleShell: p.capsuleShell
            ? [p.capsuleShell, capsuleShellNote(p.capsuleShell)].filter(Boolean).join(' — ')
            : null,
        priceRange: priceRange(p),
        // The page's display rule: a ratio, never a pack the public would read as "on offer"
        oilFlowerEquivalence: p.category === 'OIL' ? '3ml of oil counts as 1g of flower against a prescription' : null,
        description: plainText(p.description, 400) || null,
        descriptionAiAssisted: Boolean(p.aiAssisted && plainText(p.description, 400)),
        dosage: plainText(p.dosageInformation, 300) || null,
        storage: plainText(p.storageInformation, 200) || null,
        // The public picture, generated mockups included — the page labels those itself
        image: siteUrl(publicProductImagePath(p.images)),
        documents: docs.map((d) => ({
            title: String(d.title ?? ''),
            kind: String(d.kind ?? '').toLowerCase(),
            url: siteUrl(d.image?.fullpath),
        })),
        faqs: faqs.slice(0, 5).map((f) => ({
            question: f.question,
            answer: plainText(f.answer, 300) ?? '',
            aiAssisted: Boolean(f.aiAssisted),
        })),
        withheld: WITHHELD,
    };
}
