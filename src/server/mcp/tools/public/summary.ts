/**
 * The public tool copy: name, title and description, the one source for both
 * the registry and the /docs page.
 *
 * `publicTools` carries handlers that call tRPC and the database, so the
 * client bundle must never import it; this file is plain data, and every
 * tool reads its copy from here (`toolCopy`). The summary test still pins
 * the order and that every registered tool has a row.
 *
 * Descriptions are prompts (docs/MCP_PLAN.md, "Tool descriptions are
 * prompts"): when to use the tool, what it returns, and what it does NOT
 * return. Public = bare facts and the public price figures; never stock,
 * stockists, pack sizes on offer or per-pharmacy prices (DECISIONS B2/B3).
 */
export type PublicToolSummary = { name: string; title: string; description: string };

export const PUBLIC_TOOL_SUMMARY: PublicToolSummary[] = [
    {
        name: 'find_clinics',
        title: 'Find medical cannabis clinics',
        description:
            "Find UK clinics that can prescribe cannabis-based medicines. Use `near` (postcode or town) for 'near me' questions: nearest first, with miles. Filter by the conditions a clinic's published policy lists, consultation type (online, in person, phone), CQC rating, first-consultation fee, accepting patients and patient type; sort by distance, year-one clinic fees or rating. Returns up to 25 clinics at a time (page on with `offset`), each with slug, page URL, town, distance, first and follow-up fees, estimated year-one clinic fees (never medicine), consultation types, CQC rating, review score and which patient types it takes. A listed condition is the clinic's referral scope, not a statement that anyone qualifies: only a specialist decides that. It does not return doctors or appointment availability. For one clinic in full, use get_listing; to weigh several, compare_providers.",
    },
    {
        name: 'find_pharmacies',
        title: 'Find dispensing pharmacies',
        description:
            'Find UK pharmacies that dispense cannabis-based medicines against a prescription a clinic has already issued. Use `near` (postcode or town) for nearest first with miles; filter by delivery, in-person collection and review score. Returns up to 25 pharmacies at a time (page on with `offset`) with slug, page URL, town, distance, delivery and collection, and review score. A pharmacy cannot prescribe. It does not return stock, prices, or which products a pharmacy holds: those are shown only to patients and professionals with access. For delivery prices and GPhC registration use get_listing, or compare_providers for several.',
    },
    {
        name: 'find_products',
        title: 'Find medical cannabis products',
        description:
            'Find cannabis-based medicines on the UK market by product, brand or strain name, or by dose form. Returns up to 25 products at a time (page on with `offset`) with page URL, slug, brand, dose form, THC and CBD content, and the latest price a UK pharmacy charged (naming no pharmacy) when Findabis publishes one. It does not return stock, pack sizes on offer, per-pharmacy prices or which pharmacies dispense a product: those are shown only to patients and professionals with access. A listing is not a statement that a product suits anyone. For one product in full, use get_product with its slug.',
    },
    {
        name: 'get_product',
        title: 'Get one product in full',
        description:
            'Everything public about one product, by its slug from find_products or search_findabis: dose form and strength, strain and brand, terpenes, what it contains (carrier oil, allergens, capsule shell), dosage and storage notes, patient leaflets and FAQs, and its price range across UK pharmacies when Findabis publishes one. Not returned: stock, pack sizes on offer, and which pharmacies dispense it at what price — the product page shows those only to patients and professionals with access. It describes the product, never who should take it.',
    },
    {
        name: 'find_strains',
        title: 'Find cannabis strains',
        description:
            'Find cannabis strain profiles by name or genetics (Indica, Sativa or Hybrid). Returns up to 25 strains at a time (page on with `offset`) with page URL, slug, genetics and THC and CBD ranges. A strain is a plant lineage, not something a pharmacy dispenses — use find_products for that. Findabis publishes no effects, medical uses or side effects for strains, so none are returned and none should be inferred. For terpenes, flavours and lineage, use get_listing with kind "strain".',
    },
    {
        name: 'find_brands',
        title: 'Find medical cannabis brands',
        description:
            'Find the brands (makers) of cannabis-based medicines listed on Findabis, by name or by the dose forms they make. Returns up to 25 brands at a time (page on with `offset`) with slug, page URL, town and country, website, and how many of their products Findabis lists — a count, never stock or which pharmacies hold them. Sorted by name or by product count, never by sponsorship. A listing is not an endorsement. For one brand in full, use get_listing with kind "brand"; for its products, find_products with the brand name as `query`.',
    },
    {
        name: 'get_listing',
        title: 'Get one clinic, pharmacy, strain or brand',
        description:
            'The public facts on one clinic, pharmacy, strain or brand page, by `kind` and the page `slug` from find_clinics, find_pharmacies, find_strains, find_brands or search_findabis. Clinic: address, consultation types and fees, published price list, CQC rating, which patients its policy takes, partner pharmacies. Pharmacy: address, delivery and collection, delivery prices, GPhC registration, partner clinics. Strain: genetics, cannabinoid ranges, terpenes, flavours, lineage, products made from it. Brand: location, website and products. Not returned: stock, per-pharmacy medicine prices, staff, or anything about patients. For a product, use get_product.',
    },
    {
        name: 'compare_providers',
        title: 'Compare clinics or pharmacies',
        description:
            "Two to six clinics, or two to six pharmacies, side by side by slug. Clinics: first and follow-up fees, estimated year-one and later-year clinic fees with a line-by-line breakdown for the patient type and visit counts you give, consultation types, CQC rating, reviews and whether accepting patients. Pharmacies: delivery and its cheapest price, free-delivery threshold, collection, GPhC registration and inspection outcome, reviews. Use it for 'which is cheapest', 'what's the difference between'. Services only: it never compares medicines or medicine prices, and the figures are each provider's published ones.",
    },
    {
        name: 'search_findabis',
        title: 'Search everything',
        description:
            'One text search across clinics, pharmacies, products, strains and brands. Use it when you do not yet know which kind the question is about, or to turn a name into a slug; then call the specific tool, which returns more detail. Returns names, kinds, slugs and page URLs only — no prices, stock or medical information.',
    },
];

/** One tool's copy; throws at module load if a tool names a row that does not exist */
export function toolCopy(name: string): PublicToolSummary {
    const copy = PUBLIC_TOOL_SUMMARY.find((row) => row.name === name);
    if (!copy) throw new Error(`No public tool copy for ${name}`);
    return copy;
}
