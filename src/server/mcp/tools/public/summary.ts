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
            "Find UK clinics that can prescribe cannabis-based medicines. Use `near` (postcode or town) for 'near me' questions: nearest first, with miles. Filter by the conditions a clinic's published policy lists, consultation type (online, in person, phone), CQC rating, first-consultation fee, accepting patients and patient type; sort by distance, year-one clinic fees or rating. Returns up to 25 clinics at a time (page on with `offset`; past the first 60, `page`), each with slug, page URL, town, distance, first and follow-up fees, estimated year-one clinic fees (never medicine), consultation types, CQC rating, review score and which patient types it takes. A listed condition is the clinic's referral scope, not a statement that anyone qualifies: only a specialist decides that. It does not return doctors or appointment availability. For one clinic in full, use get_clinic; to weigh several, compare_providers.",
    },
    {
        name: 'get_clinic',
        title: 'Get one clinic in full',
        description:
            "The public facts on one clinic page, by its `slug` from find_clinics or search_directory: address, opening and online hours, consultation types, first and follow-up fees and the published price list, CQC rating, registration and report link, the age limits and patient types its policy takes, partner pharmacies, other locations and the page's own FAQs. A listed condition or patient type is the clinic's referral scope, not a statement that anyone qualifies. Not returned: stock, per-pharmacy medicine prices, staff, or anything about patients. To weigh several clinics, use compare_providers.",
    },
    {
        name: 'find_pharmacies',
        title: 'Find dispensing pharmacies',
        description:
            'Find UK pharmacies that dispense cannabis-based medicines against a prescription a clinic has already issued. Use `near` (postcode or town) for nearest first with miles; filter by delivery, in-person collection and review score. Returns up to 25 pharmacies at a time (page on with `offset`; past the first 60, `page`) with slug, page URL, town, distance, delivery and collection, and review score. A pharmacy cannot prescribe. It does not return stock, prices, or which products a pharmacy holds: those are shown only to patients and professionals with access. For delivery prices and GPhC registration use get_pharmacy, or compare_providers for several.',
    },
    {
        name: 'get_pharmacy',
        title: 'Get one pharmacy in full',
        description:
            "The public facts on one pharmacy page, by its `slug` from find_pharmacies or search_directory: address, opening hours, delivery and collection, each delivery option with its carrier, price, free-delivery threshold and estimated days, GPhC registration, last inspection outcome and report link, partner clinics, other locations and the page's own FAQs. A pharmacy dispenses only against a prescription a clinic has issued. Not returned: stock, which products it holds, medicine prices, staff, or anything about patients. To weigh several pharmacies, use compare_providers.",
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
            'Everything public about one product, by its slug from find_products or search_directory: dose form and strength, strain and brand, terpenes, what it contains (carrier oil, allergens, capsule shell), dosage and storage notes, patient leaflets and FAQs, and its price range across UK pharmacies when Findabis publishes one. Not returned: stock, pack sizes on offer, and which pharmacies dispense it at what price — the product page shows those only to patients and professionals with access. It describes the product, never who should take it.',
    },
    {
        name: 'find_strains',
        title: 'Find cannabis strains',
        description:
            'Find cannabis strain profiles by name or genetics (Indica, Sativa or Hybrid). Returns up to 25 strains at a time (page on with `offset`) with page URL, slug, genetics and THC and CBD ranges. A strain is a plant lineage, not something a pharmacy dispenses — use find_products for that. Findabis publishes no effects, medical uses or side effects for strains, so none are returned and none should be inferred. For terpenes, flavours and lineage, use get_strain.',
    },
    {
        name: 'get_strain',
        title: 'Get one strain in full',
        description:
            "The public profile of one cannabis strain, by its `slug` from find_strains or search_directory: genetics, THC and CBD ranges, terpenes, flavours, parent and child strains, the products made from it (names and page links), and the page's own FAQs. Findabis publishes no effects, medical uses or side effects for strains, so none are returned and none should be inferred. For a product made from it, use get_product.",
    },
    {
        name: 'find_brands',
        title: 'Find medical cannabis brands',
        description:
            'Find the brands (makers) of cannabis-based medicines listed on Findabis, by name or by the dose forms they make. Returns up to 25 brands at a time (page on with `offset`) with slug, page URL, town and country, website, and how many of their products Findabis lists — a count, never stock or which pharmacies hold them. Sorted by name or by product count, never by sponsorship. A listing is not an endorsement. For one brand in full, use get_brand; for its products, find_products with the brand name as `query`.',
    },
    {
        name: 'get_brand',
        title: 'Get one brand in full',
        description:
            "The public facts on one brand (maker) page, by its `slug` from find_brands or search_directory: town, postcode, country, website, its listed products (names and page links) and the page's own FAQs. A listing is not an endorsement. Not returned: stock or which pharmacies hold its products. For one of its products in full, use get_product; to filter its products, find_products with the brand name as `query`.",
    },
    {
        name: 'find_articles',
        title: 'Find Findabis articles',
        description:
            "Find Findabis's published articles (guides and news on medical cannabis in the UK: the law, getting a prescription, clinics, pharmacies, products) by words in the title or text, or by category. Newest first by default. Returns up to 25 at a time (page on with `offset`) with title, slug, page URL, category, date, reading time, a short excerpt and whether the page labels it AI-assisted. Articles are general information, not medical advice. To read one, use get_article with its slug.",
    },
    {
        name: 'get_article',
        title: 'Read one Findabis article',
        description:
            'One published Findabis article, by its `slug` from find_articles or search_directory: title, category, author, published and updated dates, tags, whether it is labelled AI-assisted, and the text as plain text (shortened past 6,000 characters, with the page link for the rest). An article reserved for signed-in members returns its page link instead of its text. Articles are general information, not medical advice: quote them with their page URL and never as a recommendation for a person.',
    },
    {
        name: 'compare_providers',
        title: 'Compare clinics or pharmacies',
        description:
            "Two to six clinics, or two to six pharmacies, side by side by slug. Clinics: first and follow-up fees, estimated year-one and later-year clinic fees with a line-by-line breakdown for the patient type and visit counts you give, consultation types, CQC rating, reviews and whether accepting patients. Pharmacies: delivery and its cheapest price, free-delivery threshold, collection, GPhC registration and inspection outcome, reviews. Use it for 'which is cheapest', 'what's the difference between'. Services only: it never compares medicines or medicine prices, and the figures are each provider's published ones.",
    },
    {
        name: 'search_directory',
        title: 'Search the whole directory',
        description:
            'One text search across clinics, pharmacies, products, strains, brands and Findabis articles; small misspellings still match. Use it when you do not yet know which kind the question is about, or to turn a name into a slug. Each match carries its kind, slug, page URL and a one-line summary (town, consultation types and first fee for a clinic; delivery and collection for a pharmacy; brand, dose form, THC and CBD for a product; genetics for a strain; country and product count for a brand), enough to say what something is; call the get_ tool for that kind for more. No stock, per-pharmacy prices or medical information.',
    },
    {
        name: 'get_directory_facts',
        title: 'Directory facts and counts',
        description:
            "Live figures for the whole UK directory: how many clinics, pharmacies, products, strains and brands Findabis lists; the range and median of the first-consultation fees clinics publish; how many pharmacies deliver or offer collection; and when each directory last changed. Use it for 'how many', 'what does a first consultation typically cost', 'what does Findabis cover', and to cite a figure with its date. Takes no input. Aggregates only: it names no provider and holds no stock or medicine prices. For the listings themselves, use the find_ tools.",
    },
];

/** One tool's copy; throws at module load if a tool names a row that does not exist */
export function toolCopy(name: string): PublicToolSummary {
    const copy = PUBLIC_TOOL_SUMMARY.find((row) => row.name === name);
    if (!copy) throw new Error(`No public tool copy for ${name}`);
    return copy;
}
