import { MCP_SERVER_INSTRUCTIONS } from './disclaimer';

/**
 * What a model is told once, at the handshake, after the disclaimer: which
 * tool answers which question, where slugs come from, and that the guides
 * exist. Clients do not read resources unprompted, so a model that is not
 * told about them never does. Routing copy only — every legal and medical
 * sentence stays in disclaimer.ts, which the agent contract pins.
 */
export const TOOL_ROUTING = [
    'How to use these tools:',
    '- A question that names something whose kind you do not know: search_directory. Each match carries its kind, slug, page URL and a one-line summary; call the get_ tool for that kind for more.',
    '- "Near me": find_clinics or find_pharmacies with `near` (a UK postcode or town). Many clinics also consult online UK-wide and most pharmacies deliver, so say so when few are close.',
    '- One listing in full: get_clinic, get_pharmacy, get_product, get_strain or get_brand with its slug, each with the page FAQs (and opening hours for a clinic or pharmacy). Slugs come from the find_ tools or search_directory — never guess one.',
    '- Background on the law, prescriptions and the market: find_articles, then get_article to read one; quote it with its page URL.',
    '- "Which is cheapest" or "what is the difference": compare_providers with 2-6 slugs. Services only: fees and delivery, never medicines.',
    '- "How many", "typical cost", "what does Findabis cover": get_directory_facts, and cite the figure with its date.',
    '- Lists return at most 25 rows and say how many matched; narrow with a filter before paging with `offset`.',
    '- Nothing is ordered by sponsorship: results come by distance, name, fee or rating, as asked.',
    '- For how a prescription is obtained and whom clinics take, read the resources findabis://guide/how-to-get-a-prescription and findabis://guide/eligibility rather than answering from memory.',
    '- Give the Findabis page URL beside a fact, so the person can check it.',
].join('\n');

/** The handshake `instructions`: the disclaimer and answering rules first, then the routing */
export const PUBLIC_MCP_INSTRUCTIONS = `${MCP_SERVER_INSTRUCTIONS}\n\n${TOOL_ROUTING}`;
