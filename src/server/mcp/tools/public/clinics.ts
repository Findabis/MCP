import { z } from 'zod';
import type { PublicMcpTool } from '@/server/mcp/registry';
import { summarise } from '@/server/mcp/registry';
import { publicCaller } from './caller';
import { type ClinicRow, clinicLine, scenarioFor, toClinicRow } from './clinicRow';
import { CONDITIONS, matchCondition, nearInput, nearNote, noMatchHint, radiusInput, sites, WIDE_PAGE } from './nearby';
import { clinicListOutput, patientTypeEnum } from './outputs';
import { excludesPatientType, type PatientType } from './patientTypes';
import { toolCopy } from './summary';

const CQC = ['GOOD_OR_BETTER', 'OUTSTANDING', 'GOOD', 'REQUIRES_IMPROVEMENT', 'NOT_RATED'] as const;
const MODES = ['ONLINE', 'IN_PERSON', 'PHONE'] as const;

/** A clinic set to BOTH offers online and in person */
const offers = (r: ClinicRow, mode: (typeof MODES)[number]) =>
    r.consultationTypes.includes(mode) || (mode !== 'PHONE' && r.consultationTypes.includes('BOTH'));

const byFees = (desc: boolean) => (a: ClinicRow, b: ClinicRow) => {
    if (a.firstYearClinicFees == null) return b.firstYearClinicFees == null ? 0 : 1;
    if (b.firstYearClinicFees == null) return -1;
    return desc ? b.firstYearClinicFees - a.firstYearClinicFees : a.firstYearClinicFees - b.firstYearClinicFees;
};

export const findClinics: PublicMcpTool = {
    ...toolCopy('find_clinics'),
    inputSchema: {
        query: z.string().max(120).optional().describe('Clinic name, matched as text. For a place use `near`.'),
        near: nearInput,
        radiusMiles: radiusInput,
        condition: z
            .string()
            .max(120)
            .optional()
            .describe(
                `Only clinics whose published policy lists this condition. One of: ${CONDITIONS.join('; ')}. A listed condition is the clinic's referral scope, never a statement that anyone qualifies.`,
            ),
        consultationType: z
            .enum(MODES)
            .optional()
            .describe('Only clinics offering ONLINE (video), IN_PERSON or PHONE.'),
        cqc: z.enum(CQC).optional().describe('CQC rating filter; GOOD_OR_BETTER keeps Good and Outstanding.'),
        maxFirstConsultationFee: z
            .number()
            .positive()
            .optional()
            .describe('Only clinics whose first consultation costs at most this, in GBP.'),
        acceptingPatients: z
            .boolean()
            .optional()
            .describe("Only clinics showing 'Accepting patients' (an active published policy)."),
        patientType: patientTypeEnum
            .optional()
            .describe(
                'NEW_PATIENT, TRANSFER or ACTIVE_PATIENT. Drops clinics whose policy does not take it, and prices year one for that route.',
            ),
        sort: z
            .enum(['distance', 'az', 'za', 'cheapest', 'dearest', 'rating'])
            .optional()
            .describe(
                'distance (default with `near`), az (default otherwise), za, cheapest / dearest by year-one clinic fees, rating.',
            ),
        limit: z.number().int().min(1).max(25).optional().describe('How many to return, 1-25. Default 10.'),
    },
    outputSchema: clinicListOutput,
    scopes: ['public'],
    handler: async (input, ctx) => {
        const { query, near, radiusMiles, consultationType, cqc, maxFirstConsultationFee, acceptingPatients } = input;
        const patientType = input.patientType as PatientType | undefined;
        const limit = input.limit ?? 10;
        const sort = input.sort ?? (near ? 'distance' : 'az');
        const condition = matchCondition(input.condition);
        const api = await publicCaller(ctx);
        const res: any = await api.clinic.getPagedClinics({
            sort: sort === 'za' ? 'za' : 'az',
            search: query?.trim() || undefined,
            countryCode: 'GB',
            perPage: WIDE_PAGE,
            ...(near ? { near, radius: radiusMiles } : {}),
            ...(cqc ? { cqcFilter: cqc } : {}),
            ...(condition ? { condition } : {}),
            ...(acceptingPatients ? { eligibilityStatus: 'active' as const } : {}),
            ...(patientType ? { scenario: scenarioFor(patientType) } : {}),
        });
        const scenario = scenarioFor(patientType);
        let rows = sites(res.items ?? [])
            .filter((c) => !patientType || !excludesPatientType(c, patientType))
            .map((c) => toClinicRow(c, scenario))
            .filter((r) => !consultationType || offers(r, consultationType))
            .filter(
                (r) =>
                    maxFirstConsultationFee == null ||
                    (r.initialConsultationFee ?? Infinity) <= maxFirstConsultationFee,
            );
        if (sort === 'cheapest' || sort === 'dearest') rows = [...rows].sort(byFees(sort === 'dearest'));
        if (sort === 'rating') rows = [...rows].sort((a, b) => (b.rating?.average ?? 0) - (a.rating?.average ?? 0));
        const results = rows.slice(0, limit);
        const notes = [
            nearNote(near, res.near),
            input.condition && !condition
                ? `"${input.condition}" is not a condition clinics publish; ignored. Use one of the listed values.`
                : null,
            Number(res.total ?? 0) > WIDE_PAGE
                ? `Filters read the first ${WIDE_PAGE} of ${res.total} clinics; add \`near\` or \`query\`.`
                : null,
            results.some((r) => r.firstYearClinicFees != null)
                ? 'Year-one figures are clinic fees only, never medicine.'
                : null,
        ].filter(Boolean);
        const note = notes.length ? notes.join(' ') : undefined;
        const hint = results.length
            ? 'Raise `limit` (max 25), or narrow with `radiusMiles` or a filter.'
            : noMatchHint({
                  near,
                  radiusMiles,
                  filters: [condition, consultationType, cqc, maxFirstConsultationFee, acceptingPatients, patientType],
              });
        const text = summarise(results.map(clinicLine), rows.length, hint);
        const next = results.length
            ? '\nNext: get_listing kind=clinic slug=… for one in full, or compare_providers for side by side.'
            : '';
        return {
            text: `${text}${note ? `\n${note}` : ''}${next}`,
            structured: { results, total: rows.length, ...(note ? { note } : {}) },
        };
    },
};
