import { z } from 'zod';
import { db } from '@/server/db';
import type { PublicMcpTool } from '@/server/mcp/registry';
import { McpToolError } from '@/server/mcp/registry';
import { entityFaqs } from '@/server/utils/seoData';
import { plainText } from '@/utils/jsonLd/shared';
import { toSlug } from '@/utils/slug';
import { publicCaller } from './caller';
import {
    DAYS,
    type Hours,
    type ListingOutput,
    listingOutput,
    toBrandListing,
    toClinicListing,
    toPharmacyListing,
    toStrainListing,
} from './listingShape';
import { PATIENT_TYPE_LABEL } from './patientTypes';
import { toolCopy } from './summary';

const KINDS = ['clinic', 'pharmacy', 'strain', 'brand'] as const;
type Kind = (typeof KINDS)[number];
type Api = Awaited<ReturnType<typeof publicCaller>>;
type Faq = ListingOutput['faqs'][number];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A page slug, never a row id. The page procedures take "slug or id" because
 * old links carry ids; this tool takes slugs only, refuses anything shaped
 * like a UUID, and answers only when the row it found carries that slug — so
 * an id can never be used to open a listing through it.
 */
export const slugInput = z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9][a-z0-9-]*$/i, 'A page slug: letters, digits and hyphens')
    .refine((value) => !UUID.test(value), 'Pass the page slug, not an id')
    .describe('The page slug from a find_* tool or search_findabis, e.g. "green-leaf-clinic".');

/** The page's own procedure for each kind — what the public page itself renders */
async function load(api: Api, kind: Kind, slug: string): Promise<any> {
    const quiet = <T>(promise: Promise<T>) => promise.catch(() => null);
    if (kind === 'clinic') return quiet(api.clinic.getClinicBySlug({ slugOrId: slug }));
    if (kind === 'pharmacy') return quiet(api.pharmacy.getPharmacyBySlug({ slugOrId: slug }));
    if (kind === 'strain') return quiet(api.strain.getBySlug({ slugOrId: slug }));
    return quiet(api.brand.getBrandBySlug({ slugOrId: slug }));
}

/** The FAQ table keys clinic, pharmacy and brand pages by entity type; a strain page's FAQs have their own table (`strain.getFAQs`) */
const FAQ_ENTITY: Partial<Record<Kind, string>> = { clinic: 'CLINIC', pharmacy: 'PHARMACY', brand: 'BRAND' };

/** The page's own FAQs, as get_product gives a product's: at most five, plain text, the AI-assisted label kept (E4) */
async function faqsOf(api: Api, kind: Kind, id: unknown): Promise<Faq[]> {
    if (typeof id !== 'string' || !id) return [];
    try {
        const rows: Record<string, unknown>[] =
            kind === 'strain'
                ? ((await api.strain.getFAQs({ strainId: id, limit: 5 })).items ?? [])
                : await entityFaqs(db, FAQ_ENTITY[kind] ?? '', id);
        return rows.slice(0, 5).flatMap((f) =>
            typeof f.question === 'string' && f.question
                ? [
                      {
                          question: f.question,
                          answer: plainText(String(f.answer ?? ''), 300) || '',
                          aiAssisted: Boolean(f.aiAssisted),
                      },
                  ]
                : [],
        );
    } catch {
        return [];
    }
}

/** The brand page also opens an unslugged brand by its name's slug; everything else must carry the slug */
const carriesSlug = (kind: Kind, row: any, slug: string) =>
    typeof row?.slug === 'string'
        ? row.slug.toLowerCase() === slug.toLowerCase()
        : kind === 'brand' && Boolean(row?.name) && toSlug(row.name) === slug.toLowerCase();

const SHAPE: Record<Kind, (row: any) => ListingOutput> = {
    clinic: toClinicListing,
    pharmacy: toPharmacyListing,
    strain: toStrainListing,
    brand: toBrandListing,
};

const list = (label: string, rows: { name: string; url: string | null }[] | undefined) =>
    rows?.length ? `${label}: ${rows.map((r) => (r.url ? `${r.name} (${r.url})` : r.name)).join('; ')}` : null;

/** £4.50, not £4.5; whole pounds stay whole */
const money = (v: number, currency = 'GBP') => {
    const amount = Number.isInteger(v) ? String(v) : v.toFixed(2);
    return currency === 'GBP' ? `£${amount}` : `${currency} ${amount}`;
};

const DAY_LABEL: Record<(typeof DAYS)[number], string> = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
};

/** "Opening hours: Mon 09:00-17:00 · Tue …" as the business typed them; days it left blank are left out */
const hoursLine = (label: string, hours: Hours | null | undefined) =>
    hours ? `${label}: ${DAYS.flatMap((d) => (hours[d] ? [`${DAY_LABEL[d]} ${hours[d]}`] : [])).join(' · ')}` : null;

/** The typed answer as the text block a model reads first */
function render(o: ListingOutput): string {
    const c = o.clinic;
    const p = o.pharmacy;
    const s = o.strain;
    const b = o.brand;
    const lines: (string | null | false | undefined)[] = [
        `${o.name} (${o.kind})`,
        c &&
            [c.address, c.cqcRating && `CQC ${c.cqcRating.toLowerCase().replace(/_/g, ' ')}`]
                .filter(Boolean)
                .join(' · '),
        c?.consultationTypes.length
            ? `Consultations: ${c.consultationTypes.join(', ').toLowerCase().replace(/_/g, ' ')}`
            : null,
        hoursLine('Opening hours', c?.openingHours),
        hoursLine('Online hours', c?.onlineHours),
        c &&
            Object.keys(c.priceList).length > 0 &&
            `Published fees: ${Object.entries(c.priceList)
                .map(([k, v]) => `${k} ${money(v, c.currency)}`)
                .join(', ')}`,
        c?.patientTypes &&
            `Policy takes: ${c.patientTypes.map((t) => PATIENT_TYPE_LABEL[t]).join(', ') || 'none listed'}`,
        list('Partner pharmacies', c?.partnerPharmacies),
        p &&
            [p.address, p.offersDelivery && 'delivers', p.offersCollection && 'collection'].filter(Boolean).join(' · '),
        hoursLine('Opening hours', p?.openingHours),
        p?.deliveryOptions.length
            ? `Delivery: ${p.deliveryOptions.map((d) => `${[d.carrier, d.service].filter(Boolean).join(' ') || 'delivery'} ${money(d.cost)}${d.freeOver != null ? `, free over ${money(d.freeOver)}` : ''}`).join('; ')}`
            : null,
        p?.gphcNumber &&
            `GPhC registration ${p.gphcNumber}${p.gphcInspectionOutcome ? ` · last inspection: ${p.gphcInspectionOutcome}` : ''}`,
        list('Partner clinics', p?.partnerClinics),
        s &&
            [s.genetics, s.thcPercent && `THC ${s.thcPercent}%`, s.cbdPercent && `CBD ${s.cbdPercent}%`]
                .filter(Boolean)
                .join(' · '),
        s?.terpenes.length ? `Terpenes: ${s.terpenes.join(', ')}` : null,
        s?.flavours.length ? `Flavours: ${s.flavours.join(', ')}` : null,
        list('Parents', s?.parents),
        list('Products made from it', s?.products),
        b && [b.city, b.country, b.website].filter(Boolean).join(' · '),
        list('Products', b?.products),
        o.description && `About: ${o.descriptionAiAssisted ? '(AI-assisted) ' : ''}${o.description}`,
        o.faqs.length
            ? `FAQs:\n${o.faqs.map((f) => `  Q: ${f.question}\n  A: ${f.aiAssisted ? '(AI-assisted) ' : ''}${f.answer}`).join('\n')}`
            : null,
        o.kind === 'pharmacy' && 'Stock and medicine prices: shown only to patients and professionals with access',
        o.url && `Page: ${o.url}`,
    ];
    return lines.filter(Boolean).join('\n');
}

export const getListing: PublicMcpTool = {
    ...toolCopy('get_listing'),
    inputSchema: {
        kind: z.enum(KINDS).describe('What the slug names: clinic, pharmacy, strain or brand.'),
        slug: slugInput,
    },
    outputSchema: listingOutput,
    scopes: ['public'],
    handler: async ({ kind, slug }: { kind: Kind; slug: string }, ctx) => {
        const api = await publicCaller(ctx);
        const row = await load(api, kind, slug);
        if (!row || !carriesSlug(kind, row, slug)) {
            throw new McpToolError(`No ${kind} with slug "${slug}". Use search_findabis to find the slug.`);
        }
        // The row id is a key for the page's FAQs and nothing more: it never reaches the answer
        const faqs = await faqsOf(api, kind, row.id);
        const structured = { ...SHAPE[kind]({ ...row, slug: typeof row.slug === 'string' ? row.slug : slug }), faqs };
        return { text: render(structured), structured };
    },
};
