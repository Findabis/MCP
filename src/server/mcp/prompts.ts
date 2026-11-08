import { z } from 'zod';

/**
 * The prompts the public server offers — the slash-commands a client shows
 * (Claude Desktop and Code, Cursor). Each takes one short text and nothing
 * else: a place or a name, never a health answer. The text is a tool plan
 * for the model, and every plan ends with the disclaimer step, so an answer
 * started from a prompt carries it too.
 */

/** A UK town or postcode: letters, digits, spaces and the punctuation place names use — nothing else reaches the prompt */
export const placeInput = z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[A-Za-z0-9 ,.'()-]+$/, 'A UK town, city or postcode')
    .describe('A UK town, city or postcode, e.g. "Leeds" or "M1 1AE".');

/** A listing's name as a person types it: the same characters as a place, plus the & and + brand names use */
export const nameInput = z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[A-Za-z0-9 ,.'()&+-]+$/, 'A name: letters, digits and simple punctuation')
    .describe('The name as written on Findabis, or close to it.');

export function findCareNearPrompt(place: string): string {
    return [
        `Find medical cannabis clinics and dispensing pharmacies near ${place}, UK, using the Findabis tools.`,
        '',
        `1. Call find_clinics with near "${place}" (nearest first, with miles). Many clinics also consult online UK-wide: if few are close, call it again with consultationType ONLINE and no near.`,
        `2. Call find_pharmacies with near "${place}". Most deliver UK-wide, so delivery matters more than distance.`,
        "3. List what you found with each listing's Findabis page URL, town, distance, and for clinics the published fees. Use only the distances the tools return. To weigh two or more, call compare_providers.",
        '4. Say plainly that Findabis is a directory, not medical advice; that only a specialist decides whether anyone can be prescribed; and that a pharmacy dispenses only against a prescription a clinic has issued.',
        '5. For the route to a prescription, read the resource findabis://guide/how-to-get-a-prescription.',
    ].join('\n');
}

export function productFactsPrompt(product: string): string {
    return [
        `Describe the cannabis-based medicine "${product}" from the Findabis directory, factually.`,
        '',
        `1. Call search_directory with query "${product}" and take the product match (kind "product"). If several products match, list them with their page URLs and ask which one; if none does, say Findabis does not list it.`,
        '2. Call get_product with its slug.',
        '3. Report what it returns: brand, dose form, THC and CBD, strain and genetics, terpenes, what it contains (carrier oil, allergens, capsule shell), the published price range if there is one, leaflets, and the page URL. Quote figures exactly as returned, and say that stock and per-pharmacy prices are shown only to patients and professionals with access.',
        '4. Describe, never recommend: do not say what the product is for, whom it suits or how it compares medically. Say that a specialist prescriber decides what, if anything, a person is prescribed, and that possession without a prescription is an offence in the UK.',
    ].join('\n');
}

export function checkProviderPrompt(name: string): string {
    return [
        `Check whether "${name}" is a medical cannabis clinic or pharmacy listed on Findabis, and what its public record says.`,
        '',
        `1. Call search_directory with query "${name}". If no clinic or pharmacy matches, say that Findabis does not list it — that is all the directory can say, not a judgement on the provider.`,
        '2. Call get_clinic or get_pharmacy with the slug of the match.',
        '3. For a clinic: the CQC rating, CQC registration and report link, address and opening hours, consultation types, published fees, which patient types its policy takes, and partner pharmacies. For a pharmacy: the GPhC registration number, last inspection outcome and report link, address and opening hours, delivery and collection, and partner clinics.',
        '4. Give the Findabis page URL and, where returned, the regulator link, so the person can check the register themselves. Say that Findabis is a directory, not a regulator, and does not give medical advice.',
    ].join('\n');
}

type Args = Record<string, string | undefined>;

export type PublicPrompt = {
    name: string;
    title: string;
    description: string;
    argsSchema: Record<string, z.ZodString>;
    /** The one-line description a client shows for the filled-in prompt */
    summary: (args: Args) => string;
    text: (args: Args) => string;
};

export const PUBLIC_PROMPTS: PublicPrompt[] = [
    {
        name: 'find_care_near',
        title: 'Find care near a place',
        description:
            'Clinics and dispensing pharmacies near a UK town or postcode, with Findabis page links. Takes only a place.',
        argsSchema: { place: placeInput },
        summary: ({ place }) => `Clinics and pharmacies near ${place ?? ''}`,
        text: ({ place }) => findCareNearPrompt(place ?? ''),
    },
    {
        name: 'product_facts',
        title: 'Facts about one product',
        description:
            'What Findabis publishes about one cannabis-based medicine: form, strength, strain, contents, leaflets and page link. Describes, never recommends. Takes only a product name.',
        argsSchema: { product: nameInput },
        summary: ({ product }) => `The public facts on ${product ?? ''}`,
        text: ({ product }) => productFactsPrompt(product ?? ''),
    },
    {
        name: 'check_provider',
        title: 'Check a clinic or pharmacy',
        description:
            'Whether a clinic or pharmacy is listed on Findabis and its public record: CQC or GPhC registration, inspection outcome, fees or delivery, page and regulator links. Takes only a name.',
        argsSchema: { name: nameInput },
        summary: ({ name }) => `The public record of ${name ?? ''}`,
        text: ({ name }) => checkProviderPrompt(name ?? ''),
    },
];
