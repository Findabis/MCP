import { z } from 'zod';
import type { PublicMcpTool } from '@/server/mcp/registry';
import { McpToolError } from '@/server/mcp/registry';
import { publicCaller } from './caller';
import { firstYearFees, money, scenarioFor } from './clinicRow';
import { slugInput } from './listing';
import { toClinicListing, toPharmacyListing } from './listingShape';
import { patientTypeEnum } from './outputs';
import type { PatientType } from './patientTypes';
import { toolCopy } from './summary';

/**
 * Two to six clinics or pharmacies side by side, from each page's own
 * procedure. Services only: clinic fees and pharmacy delivery, never a
 * medicine or its price (reg. 284). Every figure is the provider's published
 * one; nothing is ranked by anything Findabis is paid for.
 */

const feeLine = z.object({ label: z.string(), cost: z.number(), recurring: z.boolean() });
const clinicCompared = z.object({
    name: z.string(),
    slug: z.string(),
    url: z.string().nullable(),
    initialConsultationFee: z.number().nullable(),
    followUpConsultationFee: z.number().nullable(),
    yearOneClinicFees: z.number().nullable(),
    laterYearClinicFees: z.number().nullable(),
    feeBreakdown: z.array(feeLine),
    consultationTypes: z.array(z.string()),
    cqcRating: z.string().nullable(),
    rating: z.object({ average: z.number(), count: z.number() }).nullable(),
    acceptingPatients: z.boolean(),
    partnerPharmacies: z.number().int(),
});
const pharmacyCompared = z.object({
    name: z.string(),
    slug: z.string(),
    url: z.string().nullable(),
    offersDelivery: z.boolean(),
    offersCollection: z.boolean(),
    cheapestDelivery: z.number().nullable(),
    freeDeliveryOver: z.number().nullable(),
    gphcNumber: z.string().nullable(),
    gphcInspectionOutcome: z.string().nullable(),
    rating: z.object({ average: z.number(), count: z.number() }).nullable(),
    partnerClinics: z.number().int(),
});

const outputSchema = {
    kind: z.enum(['clinic', 'pharmacy']),
    clinics: z.array(clinicCompared).optional(),
    pharmacies: z.array(pharmacyCompared).optional(),
    missing: z.array(z.string()).describe('Slugs with no such listing'),
    note: z.string(),
};

const NOTE_CLINIC =
    'Clinic fees only (consultations, membership, prescription fee); medicine is priced separately by the pharmacy and is not included. Figures are as each clinic publishes them; check the page before relying on one.';
const NOTE_PHARMACY = 'Delivery prices as each pharmacy publishes them. Medicine prices are not compared here.';

const orNone = (v: number | null) => (v == null ? 'not published' : money(v));

export const compareProviders: PublicMcpTool = {
    ...toolCopy('compare_providers'),
    inputSchema: {
        kind: z.enum(['clinic', 'pharmacy']).describe('Compare clinics or pharmacies (not both at once).'),
        slugs: z.array(slugInput).min(2).max(6).describe('2-6 page slugs from find_clinics / find_pharmacies.'),
        patientType: patientTypeEnum
            .optional()
            .describe('Clinics: price year one as NEW_PATIENT (default), TRANSFER or ACTIVE_PATIENT.'),
        followUpsPerYear: z
            .number()
            .int()
            .min(0)
            .max(24)
            .optional()
            .describe('Clinics: follow-up consultations a year. Default 4.'),
        prescriptionsPerYear: z
            .number()
            .int()
            .min(0)
            .max(24)
            .optional()
            .describe('Clinics: repeat prescriptions a year. Default 12.'),
    },
    outputSchema,
    scopes: ['public'],
    handler: async ({ kind, slugs, patientType, followUpsPerYear, prescriptionsPerYear }, ctx) => {
        const api = await publicCaller(ctx);
        const unique = [...new Set<string>(slugs.map((s: string) => s.toLowerCase()))];
        const rows = await Promise.all(
            unique.map((slug) =>
                (kind === 'clinic'
                    ? api.clinic.getClinicBySlug({ slugOrId: slug })
                    : api.pharmacy.getPharmacyBySlug({ slugOrId: slug })
                ).then(
                    (row: any) => (row?.slug?.toLowerCase() === slug ? row : null),
                    () => null,
                ),
            ),
        );
        const missing = unique.filter((_, i) => !rows[i]);
        const found = rows.filter((row): row is NonNullable<typeof row> => row != null);
        if (found.length === 0)
            throw new McpToolError('None of those slugs is a listing. Use find_clinics / find_pharmacies first.');

        if (kind === 'clinic') {
            const scenario = scenarioFor(
                patientType as PatientType | undefined,
                followUpsPerYear ?? 4,
                prescriptionsPerYear ?? 12,
            );
            const clinics = found.map((c) => {
                const d = toClinicListing(c).clinic!;
                const year = firstYearFees(c.pricing, scenario);
                return {
                    name: String(c.name),
                    slug: String(c.slug),
                    url: d.url,
                    initialConsultationFee: d.initialConsultationFee,
                    followUpConsultationFee: d.followUpConsultationFee,
                    yearOneClinicFees: year?.year1Total ?? null,
                    laterYearClinicFees: year?.recurringYearlyTotal ?? null,
                    feeBreakdown: year?.breakdown ?? [],
                    consultationTypes: d.consultationTypes,
                    cqcRating: d.cqcRating,
                    rating: d.rating,
                    acceptingPatients: d.acceptingPatients,
                    partnerPharmacies: d.partnerPharmacies.length,
                };
            });
            const lines = clinics.map(
                (c) =>
                    `${c.name} — first ${orNone(c.initialConsultationFee)}, follow-up ${orNone(c.followUpConsultationFee)}, year one ${orNone(c.yearOneClinicFees)}, later years ${orNone(c.laterYearClinicFees)} · ${c.consultationTypes.join('/') || 'mode not listed'} · CQC ${c.cqcRating ?? 'not rated'} · ${c.rating ? `${c.rating.average.toFixed(1)}★ (${c.rating.count})` : 'no reviews'}${c.acceptingPatients ? ' · accepting' : ''} · ${c.url ?? ''}`,
            );
            const scen = `Scenario: ${(patientType ?? 'NEW_PATIENT').toLowerCase().replace(/_/g, ' ')}, ${scenario.followUpsPerYear} follow-ups, ${scenario.prescriptionsPerYear} prescriptions a year.`;
            const text = [scen, ...lines, missing.length ? `Not found: ${missing.join(', ')}` : '', NOTE_CLINIC]
                .filter(Boolean)
                .join('\n');
            return { text, structured: { kind, clinics, missing, note: NOTE_CLINIC } };
        }

        const pharmacies = found.map((p) => {
            const d = toPharmacyListing(p).pharmacy!;
            const costs = d.deliveryOptions.map((o) => o.cost);
            const thresholds = d.deliveryOptions.map((o) => o.freeOver).filter((v): v is number => v != null);
            return {
                name: String(p.name),
                slug: String(p.slug),
                url: d.url,
                offersDelivery: d.offersDelivery,
                offersCollection: d.offersCollection,
                cheapestDelivery: costs.length ? Math.min(...costs) : null,
                freeDeliveryOver: thresholds.length ? Math.min(...thresholds) : null,
                gphcNumber: d.gphcNumber,
                gphcInspectionOutcome: d.gphcInspectionOutcome,
                rating: d.rating,
                partnerClinics: d.partnerClinics.length,
            };
        });
        const lines = pharmacies.map(
            (p) =>
                `${p.name} — ${p.offersDelivery ? `delivery from ${orNone(p.cheapestDelivery)}${p.freeDeliveryOver != null ? `, free over ${money(p.freeDeliveryOver)}` : ''}` : 'no delivery'}${p.offersCollection ? ' · collection' : ''} · GPhC ${p.gphcNumber ?? 'not listed'}${p.gphcInspectionOutcome ? ` (${p.gphcInspectionOutcome})` : ''} · ${p.rating ? `${p.rating.average.toFixed(1)}★ (${p.rating.count})` : 'no reviews'} · ${p.url ?? ''}`,
        );
        const text = [...lines, missing.length ? `Not found: ${missing.join(', ')}` : '', NOTE_PHARMACY]
            .filter(Boolean)
            .join('\n');
        return { text, structured: { kind, pharmacies, missing, note: NOTE_PHARMACY } };
    },
};
