import { z } from 'zod';
import { type ListingKind, pageUrl } from '@/server/mcp/links';
import { productDisplayName } from '@/utils';
import { plainText } from '@/utils/jsonLd/shared';
import { percentRange } from '@/utils/percentRange';
import { toClinicRow } from './clinicRow';
import { clinicRow, linkRow, pharmacyRow } from './outputs';
import { toPharmacyRow } from './pharmacies';

/**
 * `get_listing`'s typed answer: the facts the public page shows, built field
 * by field from the page procedure's shape. Never a stock figure, a listing
 * count, a per-pharmacy medicine price, staff names or a phone or email.
 */
const text = z.string().nullable();
const links = z.array(linkRow);

const clinicDetail = clinicRow.extend({
    address: text,
    website: text,
    pricingModel: text,
    priceList: z.record(z.string(), z.number()).describe('Published fees by name, in `currency`; absent = not set'),
    cqcRegistration: text,
    cqcReportUrl: text,
    minimumAge: z.number().int().nullable(),
    maximumAge: z.number().int().nullable(),
    partnerPharmacies: links,
    otherLocations: links,
});

const pharmacyDetail = pharmacyRow.extend({
    address: text,
    website: text,
    deliveryOptions: z.array(
        z.object({
            carrier: text,
            service: text,
            cost: z.number(),
            freeOver: z.number().nullable(),
            estimatedDays: text,
        }),
    ),
    gphcNumber: text,
    gphcInspectionOutcome: text,
    gphcReportUrl: text,
    partnerClinics: links,
    otherLocations: links,
});

const strainDetail = z.object({
    genetics: text,
    thcPercent: text,
    cbdPercent: text,
    terpenes: z.array(z.string()),
    flavours: z.array(z.string()),
    parents: links,
    children: links,
    products: links.describe('Products made from this strain — names and pages only'),
});

const brandDetail = z.object({ city: text, postcode: text, country: text, website: text, products: links });

export const listingOutput = {
    kind: z.enum(['clinic', 'pharmacy', 'strain', 'brand']),
    name: z.string(),
    slug: z.string(),
    url: z.string().url().nullable(),
    description: text,
    descriptionAiAssisted: z.boolean(),
    clinic: clinicDetail.optional(),
    pharmacy: pharmacyDetail.optional(),
    strain: strainDetail.optional(),
    brand: brandDetail.optional(),
};

export type ListingOutput = z.infer<z.ZodObject<typeof listingOutput>>;

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const int = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) ? v : null);
const address = (r: any) =>
    [r.address, r.addressLine2, r.town ?? r.city, r.postcode].map(str).filter(Boolean).join(', ') || null;
const linkTo = (kind: ListingKind, rows: any[] | undefined, name = (r: any) => String(r?.name ?? '')) =>
    (rows ?? []).filter((r) => r?.name).map((r) => ({ name: name(r), url: pageUrl(kind, r.slug) }));
const others = (kind: ListingKind, rows: any[] | undefined, selfSlug: string) =>
    linkTo(
        kind,
        (rows ?? []).filter((r) => r.slug !== selfSlug),
    );

function priceList(pricing: Record<string, unknown> | null | undefined): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [key, value] of Object.entries(pricing ?? {})) {
        if (key.endsWith('Price') && typeof value === 'number' && value > 0) out[key.replace(/Price$/, '')] = value;
    }
    return out;
}

const base = (kind: ListingOutput['kind'], r: any) => ({
    kind,
    name: String(r.name ?? ''),
    slug: String(r.slug),
    url: pageUrl(kind, r.slug),
    description: plainText(r.description, 500) || null,
    descriptionAiAssisted: Boolean(r.aiAssisted && plainText(r.description, 500)),
});

export function toClinicListing(c: any): ListingOutput {
    const policy = c.eligibilityPolicy?.isActive ? c.eligibilityPolicy : null;
    return {
        ...base('clinic', c),
        clinic: {
            // The page flattens the CQC record; the card reads it nested
            ...toClinicRow({ ...c, cqcRecord: { rating: c.cqcRating ?? c.cqcRecord?.rating ?? null } }),
            address: address(c),
            website: str(c.website),
            pricingModel: str(c.pricing?.pricingModel),
            priceList: priceList(c.pricing),
            cqcRegistration: str(c.cqcRegistrationNumber),
            cqcReportUrl: str(c.cqcReportUrl),
            minimumAge: int(policy?.minimumAge),
            maximumAge: int(policy?.maximumAge),
            partnerPharmacies: linkTo(
                'pharmacy',
                (c.connectedPharmacies ?? []).map((x: any) => x.pharmacy ?? x),
            ),
            otherLocations: others('clinic', c.organization?.clinics, c.slug),
        },
    };
}

export function toPharmacyListing(p: any): ListingOutput {
    return {
        ...base('pharmacy', p),
        pharmacy: {
            ...toPharmacyRow(p),
            address: address(p),
            website: str(p.website),
            deliveryOptions: (p.deliveryOptions ?? []).map((o: any) => ({
                carrier: str(o.deliveryProvider?.carrier?.name),
                service: str(o.deliveryProvider?.serviceType),
                cost: Number(o.cost ?? 0),
                freeOver: o.freeThreshold == null ? null : Number(o.freeThreshold),
                estimatedDays: o.estimatedDays == null ? null : String(o.estimatedDays),
            })),
            gphcNumber: str(p.compliance?.gphcNumber),
            gphcInspectionOutcome: str(p.compliance?.gphcOutcome),
            gphcReportUrl: str(p.compliance?.gphcReportUrl),
            partnerClinics: linkTo(
                'clinic',
                (p.connectedClinics ?? []).map((x: any) => x.clinic ?? x),
            ),
            otherLocations: others('pharmacy', p.organization?.pharmacies, p.slug),
        },
    };
}

export function toStrainListing(s: any): ListingOutput {
    const terpene = (t: any) => str(t.terpene?.name);
    return {
        ...base('strain', s),
        strain: {
            genetics: str(s.strainType?.name),
            thcPercent: percentRange(s.thcContent, s.thcContentMax),
            cbdPercent: percentRange(s.cbdContent, s.cbdContentMax),
            terpenes: (s.strainTerpenes ?? []).map(terpene).filter(Boolean) as string[],
            flavours: (s.strainFlavours ?? []).map((f: any) => str(f.flavour?.name)).filter(Boolean) as string[],
            parents: linkTo(
                'strain',
                (s.parentStrains ?? []).map((x: any) => x.parentStrain),
            ),
            children: linkTo(
                'strain',
                (s.childStrains ?? []).map((x: any) => x.childStrain),
            ),
            products: linkTo('product', s.catalogProducts, (p) => productDisplayName(p)),
        },
    };
}

export function toBrandListing(b: any): ListingOutput {
    return {
        ...base('brand', b),
        brand: {
            city: str(b.city),
            postcode: str(b.postcode),
            country: str(b.country?.name),
            website: str(b.website),
            products: linkTo('product', b.catalogProducts, (p) => productDisplayName(p)),
        },
    };
}
