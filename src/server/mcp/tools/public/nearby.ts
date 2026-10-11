import { z } from 'zod';
import { POLICY_CONDITION_OPTIONS } from '@/components/pages/System/Clinic/EligibilityTab/types';
import { NEAR_MAX_LENGTH, RADIUS_MAX_MILES } from '@/utils/nearSearch';

/**
 * What the clinic and pharmacy list tools share: the `near` place search
 * (the directory's own `?near=`, postcodes.io behind it), the conditions a
 * clinic policy can list, and the hint a model gets when nothing matched.
 */

/** The directory caps a page at 60; the tools read that page whole and filter it */
export const WIDE_PAGE = 60;

export const nearInput = z
    .string()
    .trim()
    .min(2)
    .max(NEAR_MAX_LENGTH)
    .optional()
    .describe('A UK postcode, outcode or town, e.g. "M1 1AE", "LS6" or "Bristol". Sorts nearest first and adds miles.');

export const radiusInput = z
    .number()
    .positive()
    .max(RADIUS_MAX_MILES)
    .optional()
    .describe('Only within this many miles of `near`. Ignored without `near`.');

/** The directory groups an organisation's sites into one entry; the model wants the sites */
export const sites = (items: any[]): any[] => items.flatMap((i) => (i.__grouped ? i.entities : [i]));

/** Conditions a clinic's eligibility policy can list, as the clinic picks them */
export const CONDITIONS: readonly string[] = POLICY_CONDITION_OPTIONS.filter((c) => c !== 'Other');

const fold = (s: string) =>
    s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

/** The stored option a free-text condition names ("ptsd", "chronic pain", "crohns"), or null */
export function matchCondition(text: string | undefined): string | null {
    const wanted = text ? fold(text) : '';
    if (!wanted) return null;
    const exact = CONDITIONS.find((c) => fold(c) === wanted);
    if (exact) return exact;
    return CONDITIONS.find((c) => c.split(/[/()]/).some((part) => fold(part) && fold(part).includes(wanted))) ?? null;
}

/** Said when `near` could not be placed — the list then falls back to the whole directory */
export function nearNote(near: string | undefined, status: { found: boolean } | undefined): string | null {
    if (!near || status?.found !== false) return null;
    return `Could not place "${near}"; showing the directory unsorted by distance. Try a full postcode or a town name.`;
}

/** What to try when a filtered search finds nothing */
export function noMatchHint({
    near,
    radiusMiles,
    filters,
}: {
    near?: string;
    radiusMiles?: number;
    filters: unknown[];
}): string {
    const tips = [
        near && radiusMiles ? `widen \`radiusMiles\` (now ${radiusMiles})` : null,
        filters.some((f) => f != null && f !== false) ? 'drop a filter' : null,
        'many clinics consult online nationwide, so try consultationType ONLINE without `near`',
    ].filter(Boolean);
    return `Try: ${tips.join('; ')}.`;
}
