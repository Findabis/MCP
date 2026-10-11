import type { z } from 'zod';
import { linkLine, pageUrl } from '@/server/mcp/links';
import { calculateClinicCost, type PatientScenario } from '@/utils/clinicCostCalculator';
import type { clinicRow } from './outputs';
import { acceptedPatientTypes, PATIENT_TYPE_LABEL, type PatientType, SCENARIO_OF } from './patientTypes';

/**
 * One clinic as the list and compare tools return it, and its one-line
 * text. The first-year figure is the website's own cost calculator over the
 * clinic's published fees — consultations, membership and the clinic's
 * prescription fee — and never a medicine price (reg. 284: medicines are
 * described, not priced into a recommendation).
 */
export type ClinicRow = z.infer<typeof clinicRow>;

export const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
export const num = (v: unknown) => (v == null || Number.isNaN(Number(v)) ? null : Number(v));
export const ratingOf = (c: any) =>
    c.ratingCount > 0 && c.ratingAverage != null ? { average: Number(c.ratingAverage), count: c.ratingCount } : null;
export const place = (r: { city: string | null; postcode: string | null; distanceMiles?: number | null }) =>
    [[r.city, r.postcode].filter(Boolean).join(' ') || 'location not listed', miles(r.distanceMiles)]
        .filter(Boolean)
        .join(' ');
export const stars = (r: { rating: { average: number; count: number } | null }) =>
    r.rating ? ` · ${r.rating.average.toFixed(1)}★ (${r.rating.count})` : '';
const miles = (d: number | null | undefined) => (d == null ? null : `(${d.toFixed(1)} mi)`);

/** The website's default scenario: four follow-ups and monthly prescriptions */
export function scenarioFor(type: PatientType = 'NEW_PATIENT', followUps = 4, prescriptions = 12): PatientScenario {
    return {
        patientType: SCENARIO_OF[type],
        followUpsPerYear: followUps,
        prescriptionsPerYear: prescriptions,
        specialistConsultsPerYear: 0,
        needsTravelLetter: false,
    };
}

/** Year-one clinic fees under the scenario; null when the clinic publishes no price list */
export function firstYearFees(pricing: unknown, scenario: PatientScenario) {
    const cost = calculateClinicCost((pricing ?? null) as never, scenario);
    return cost && cost.year1Total > 0 ? cost : null;
}

export const money = (v: number, currency = 'GBP') => {
    const amount = Number.isInteger(v) ? String(v) : v.toFixed(2);
    return currency === 'GBP' ? `£${amount}` : `${currency} ${amount}`;
};

export function toClinicRow(c: any, scenario: PatientScenario = scenarioFor()): ClinicRow {
    const year = firstYearFees(c.pricing, scenario);
    return {
        name: String(c.name ?? ''),
        slug: str(c.slug),
        url: pageUrl('clinic', c.slug),
        city: str(c.city ?? c.town),
        postcode: str(c.postcode),
        distanceMiles: typeof c.distanceMiles === 'number' ? c.distanceMiles : null,
        currency: str(c.country?.currencyCode) ?? 'GBP',
        initialConsultationFee: num(c.initialConsultationPrice),
        followUpConsultationFee: num(c.consultationPrice),
        firstYearClinicFees: year ? year.year1Total : null,
        consultationTypes: Array.isArray(c.consultationTypes) ? c.consultationTypes.map(String) : [],
        cqcRating: str(c.cqcRecord?.rating),
        rating: ratingOf(c),
        acceptingPatients: Boolean(c.eligibilityPolicy?.isActive),
        patientTypes: acceptedPatientTypes(c.eligibilityPolicy),
    };
}

export function clinicLine(r: ClinicRow): string {
    const fee = (label: string, v: number | null) => (v == null ? null : `${label} ${money(v, r.currency)}`);
    const takes = r.patientTypes?.length
        ? ` · takes ${r.patientTypes.map((t) => PATIENT_TYPE_LABEL[t]).join(', ')}`
        : '';
    const facts = [
        fee('first consult', r.initialConsultationFee),
        fee('follow-up', r.followUpConsultationFee),
        fee('est. year-one clinic fees', r.firstYearClinicFees),
        r.consultationTypes.length && r.consultationTypes.join('/').toLowerCase().replace(/_/g, ' '),
        r.cqcRating && `CQC ${r.cqcRating.toLowerCase().replace(/_/g, ' ')}`,
        r.acceptingPatients && 'accepting patients',
    ].filter(Boolean);
    const slug = r.slug ? ` [slug: ${r.slug}]` : '';
    return `${r.name}${slug} — ${place(r)}${stars(r)}${facts.length ? ` · ${facts.join(', ')}` : ''}${takes}${linkLine(r.url)}`;
}
