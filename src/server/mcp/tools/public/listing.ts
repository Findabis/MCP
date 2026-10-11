import { z } from 'zod';
import type { PublicMcpTool } from '@/server/mcp/registry';
import { McpToolError } from '@/server/mcp/registry';
import { toSlug } from '@/utils/slug';
import { publicCaller } from './caller';
import {
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
async function load(api: Awaited<ReturnType<typeof publicCaller>>, kind: Kind, slug: string): Promise<any> {
    const quiet = <T>(promise: Promise<T>) => promise.catch(() => null);
    if (kind === 'clinic') return quiet(api.clinic.getClinicBySlug({ slugOrId: slug }));
    if (kind === 'pharmacy') return quiet(api.pharmacy.getPharmacyBySlug({ slugOrId: slug }));
    if (kind === 'strain') return quiet(api.strain.getBySlug({ slugOrId: slug }));
    return quiet(api.brand.getBrandBySlug({ slugOrId: slug }));
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
        const structured = SHAPE[kind]({ ...row, slug: typeof row.slug === 'string' ? row.slug : slug });
        return { text: render(structured), structured };
    },
};
