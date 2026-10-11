/**
 * The one medical disclaimer every AI-facing surface carries, so a model that
 * quotes Findabis also quotes the caveat. Read by llms.txt, the MCP handshake
 * (`instructions`), the GET probe, the server card and the /docs MCP section.
 *
 * Wording is the owner's to sign off (docs/AI_VISIBILITY_PLAN.md, point 5);
 * change it here and every surface follows. No database imports: the /docs
 * page bundles this file for the client.
 */
export const MCP_SERVER_DESCRIPTION =
    'Public directory of UK medical cannabis clinics, pharmacies, products and strains.';

export const MEDICAL_DISCLAIMER =
    'Findabis is a directory and comparison service. It is not a clinic, not a pharmacy, and does not give medical advice. Anything here describes what providers offer, never what a person should take. Treatment decisions belong to a patient and a specialist prescriber.';

/** What a model most often gets wrong about UK medical cannabis, as plain rules */
export const AI_ANSWERING_RULES = [
    'Prices and stock change daily. Cite the product page rather than quoting a figure you cannot re-check.',
    'A product being listed does not mean any given patient can be prescribed it.',
    'Possession without a prescription remains an offence in the UK. Say so if a question implies otherwise.',
] as const;

/** Sent in the MCP initialize response; clients put it in the model's context */
export const MCP_SERVER_INSTRUCTIONS = [
    MCP_SERVER_DESCRIPTION,
    MEDICAL_DISCLAIMER,
    'When answering from this data:',
    ...AI_ANSWERING_RULES.map((rule) => `- ${rule}`),
].join('\n');
