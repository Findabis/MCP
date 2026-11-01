import { z } from 'zod';

/**
 * The typed answers (`structuredContent`) of the public tools. Every field is
 * named here on purpose: the SDK validates each answer against these, and a
 * tool builds its rows field by field, so a restricted column on a row the
 * procedure returned (stock, an in-stock count, a per-pharmacy price) has no
 * slot to travel in.
 */

const url = z
    .string()
    .url()
    .nullable()
    .describe('Canonical Findabis page, absolute; null when the listing has no page');
const money = z.number().nullable().describe('In `currency`; null when not published');
const rating = z
    .object({ average: z.number(), count: z.number().int() })
    .nullable()
    .describe('Published patient reviews; null when there are none');

/** The envelope every list tool shares: a short slice and how much it left */
const list = <T extends z.ZodTypeAny>(row: T) => ({
    results: z.array(row),
    total: z.number().int().describe('How many matched in all; narrow the query when this exceeds the results'),
    note: z.string().optional(),
});

export const patientTypeEnum = z.enum(['NEW_PATIENT', 'TRANSFER', 'ACTIVE_PATIENT']);

export const clinicRow = z.object({
    name: z.string(),
    slug: z.string().nullable(),
    url,
    city: z.string().nullable(),
    postcode: z.string().nullable(),
    distanceMiles: z.number().nullable().describe('Miles from `near`; null when no place was given'),
    currency: z.string(),
    initialConsultationFee: money,
    followUpConsultationFee: money,
    firstYearClinicFees: money.describe(
        "Estimated year-one clinic fees (consultations, membership, the clinic's prescription fee) for the asked patient type with 4 follow-ups and 12 prescriptions; never includes medicine; null when no price list is published",
    ),
    consultationTypes: z.array(z.string()),
    cqcRating: z.string().nullable(),
    rating,
    acceptingPatients: z.boolean().describe("Shows 'Accepting patients' (an active published eligibility policy)"),
    patientTypes: z
        .array(patientTypeEnum)
        .nullable()
        .describe('Patient types the published policy takes; null when the clinic publishes no policy'),
});

export const pharmacyRow = z.object({
    name: z.string(),
    slug: z.string().nullable(),
    url,
    city: z.string().nullable(),
    postcode: z.string().nullable(),
    distanceMiles: z.number().nullable().describe('Miles from `near`; null when no place was given'),
    offersDelivery: z.boolean(),
    offersCollection: z.boolean(),
    rating,
});

export const productRow = z.object({
    name: z.string(),
    slug: z.string().nullable(),
    url,
    brand: z.string().nullable(),
    category: z.string().describe('Dose form: FLOWER, OIL, CAPSULE, EDIBLE, TOPICAL, CARTRIDGE or HASH'),
    thc: z.string().nullable().describe('THC content as the page prints it, unit included'),
    cbd: z.string().nullable().describe('CBD content as the page prints it, unit included'),
    discontinued: z.boolean(),
    latestPrice: z
        .object({ amount: z.number(), currency: z.string() })
        .nullable()
        .describe('The latest price any UK pharmacy charged, naming no pharmacy; null when not published'),
});

export const strainRow = z.object({
    name: z.string(),
    slug: z.string().nullable(),
    url,
    genetics: z.string().nullable(),
    thcPercent: z.string().nullable().describe('A figure or a range, e.g. "18-22"'),
    cbdPercent: z.string().nullable(),
});

export const brandRow = z.object({
    name: z.string(),
    slug: z.string().nullable(),
    url,
    city: z.string().nullable(),
    country: z.string().nullable(),
    website: z.string().nullable(),
    productCount: z
        .number()
        .int()
        .describe('Products of this brand listed on Findabis (approved and not withdrawn); a count, never stock'),
});

export const searchRow = z.object({
    kind: z.enum(['clinic', 'pharmacy', 'product', 'strain', 'brand', 'article']),
    name: z.string(),
    slug: z.string().nullable(),
    url,
    summary: z
        .string()
        .nullable()
        .describe('One line of public facts: town, services, fees, dose form, strength, genetics or country'),
});

export const clinicListOutput = list(clinicRow);
export const pharmacyListOutput = list(pharmacyRow);
export const productListOutput = list(productRow);
export const strainListOutput = list(strainRow);
export const brandListOutput = list(brandRow);
export const searchOutput = { results: z.array(searchRow) };

/** A named link — a partner, a lineage parent, a product made from a strain */
export const linkRow = z.object({ name: z.string(), url });

/** One directory in `get_directory_facts`: a count and its page, never a row */
const directory = <T extends z.ZodRawShape>(extra: T) =>
    z.object({
        count: z.number().int().describe('Listings in the UK directory right now'),
        url: z.string().url().describe('The directory page, absolute'),
        ...extra,
    });
const date = z.string().nullable().describe('YYYY-MM-DD');

export const factsOutput = {
    asOf: z.string().describe('The day these figures were read, YYYY-MM-DD'),
    country: z.literal('GB'),
    clinics: directory({
        firstConsultationFee: z
            .object({ min: z.number(), max: z.number(), median: z.number(), stated: z.number().int() })
            .nullable()
            .describe(
                'Published first-consultation fees in GBP across the clinics that state one; null when none does',
            ),
        updatedAt: date.describe('When a listed clinic last changed its listing'),
    }).nullable(),
    pharmacies: directory({
        delivery: z.number().int().describe('How many deliver'),
        collection: z.number().int().describe('How many offer in-person collection'),
        updatedAt: date.describe('When a listed pharmacy last changed its listing'),
    }).nullable(),
    products: directory({}),
    strains: directory({}),
    brands: directory({}),
    note: z.string(),
};
