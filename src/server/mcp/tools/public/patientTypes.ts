import { normalizeStringArray } from '@/server/services/eligibilityMatch';

/**
 * Who a clinic's published eligibility policy takes, read the way the
 * eligibility matcher reads it (server/services/eligibilityMatch): an
 * explicit list of patient statuses when the clinic set one, and the three
 * "accepts" switches. Only an ACTIVE policy speaks — a clinic with none has
 * published nothing, so it is "unknown" (null), never "takes nobody".
 */
export type PatientType = 'NEW_PATIENT' | 'TRANSFER' | 'ACTIVE_PATIENT';

const ALL: PatientType[] = ['NEW_PATIENT', 'TRANSFER', 'ACTIVE_PATIENT'];

export const PATIENT_TYPE_LABEL: Record<PatientType, string> = {
    NEW_PATIENT: 'new patients',
    TRANSFER: 'transfers',
    ACTIVE_PATIENT: 'patients already under treatment',
};

/** The website's cost calculator names the routes differently (utils/clinicCostCalculator) */
export const SCENARIO_OF = {
    NEW_PATIENT: 'NEW_PATIENT',
    TRANSFER: 'TRANSFER',
    ACTIVE_PATIENT: 'EXISTING_PATIENT',
} as const satisfies Record<PatientType, string>;

type Policy = {
    isActive?: boolean | null;
    acceptedPatientStatuses?: unknown;
    acceptsNewPatients?: boolean | null;
    acceptsTransfers?: boolean | null;
    acceptsActivePatients?: boolean | null;
} | null;

const SWITCH: Record<PatientType, keyof NonNullable<Policy>> = {
    NEW_PATIENT: 'acceptsNewPatients',
    TRANSFER: 'acceptsTransfers',
    ACTIVE_PATIENT: 'acceptsActivePatients',
};

export function acceptedPatientTypes(policy: Policy | undefined): PatientType[] | null {
    if (!policy?.isActive) return null;
    const listed = normalizeStringArray(policy.acceptedPatientStatuses);
    return ALL.filter((type) => (!listed.length || listed.includes(type)) && policy[SWITCH[type]] !== false);
}

/** True only when the clinic has published that it does not take this type */
export function excludesPatientType(clinic: { eligibilityPolicy?: Policy }, type: PatientType): boolean {
    const accepted = acceptedPatientTypes(clinic.eligibilityPolicy ?? null);
    return accepted !== null && !accepted.includes(type);
}
