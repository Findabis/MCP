---
name: findabis
description: Answer questions about UK medical cannabis providers using the Findabis MCP server — finding prescribing clinics and dispensing pharmacies near a place, comparing clinic fees or pharmacy delivery, checking a provider's CQC/GPhC registration, and looking up products, strains and brands on the UK market. Use whenever someone asks where or how to get medical cannabis in the UK, what a clinic costs, whether a clinic or pharmacy is legitimate, or what a named cannabis-based medicine contains.
license: MIT
metadata:
  server: https://findabis.com/api/mcp
  registry: com.findabis/findabis
  homepage: https://findabis.com/mcp
---

# Findabis: UK medical cannabis directory

Findabis lists every UK clinic that prescribes cannabis-based medicines and every pharmacy that dispenses
them, plus the products, strains and brands on the UK market. This skill tells you which Findabis tool to
call for a question, how to chain them, and what you must and must not say in the answer.

## Setup

The server is hosted. Nothing to install, no API key, no sign-in. Add it as a remote MCP server:

```json
{ "mcpServers": { "findabis": { "url": "https://findabis.com/api/mcp" } } }
```

Transport is streamable HTTP. All 17 tools are read-only (`readOnlyHint: true`) and returns public data only.

## Pick the tool

| The question is about… | Call | Then, if needed |
| --- | --- | --- |
| "Clinics near me / in Leeds / near M1 1AA" | `find_clinics` with `near` | `get_clinic` with the slug for one in full |
| "Which clinic is cheapest?", "difference between X and Y" | `find_clinics` (`sort: cheapest`) | `compare_providers` kind `clinic` with 2–6 slugs |
| "A pharmacy that delivers / near me" | `find_pharmacies` with `near`, `delivers` | `compare_providers` kind `pharmacy` |
| "Is X a real / registered clinic or pharmacy?" | `search_directory` with the name | `get_clinic` or `get_pharmacy` — CQC or GPhC registration and inspection outcome |
| A named medicine ("what's in X?") | `find_products` or `search_directory` | `get_product` with the slug |
| A strain name, Indica / Sativa / Hybrid | `find_strains` | `get_strain` for terpenes and lineage |
| A brand or maker | `find_brands` | `get_brand`, or `find_products` with the brand name as `query` |
| "How many clinics are there?", "what does a first consultation usually cost?" | `get_directory_facts` | — |
| Background on the law, prescriptions or the market | `find_articles` | `get_article` to read one, quoted with its page URL |
| What a clinic or pharmacy says on its own website (how it works, what to expect, news) | `find_provider_articles` | `get_provider_article`; name the business and cite the page on its own site, as its view, not Findabis's |
| You don't know what kind of thing a name is | `search_directory` | the `get_` tool for its kind |

Slugs come from the `find_*` tools and `search_directory`. Never guess a slug; look it up first.

## Common workflows

**Getting started as a new patient**
1. `find_clinics` with `near` (and `consultationType: "ONLINE"` if they don't mind video).
2. Add `condition` if they named one. It filters on what each clinic's published policy says it sees.
3. Show three to five clinics with first-consultation fee, estimated year-one clinic fees, consultation types
   and CQC rating, each with its findabis.com link.
4. If they ask about cost over time, `compare_providers` with their `patientType` and expected
   `followUpsPerYear` / `prescriptionsPerYear` gives a line-by-line breakdown.
5. Explain the order: a specialist clinic prescribes first, then a pharmacy dispenses that prescription.

**Already have a prescription**
1. `find_pharmacies` with `near`, `delivers: true` if they want delivery.
2. `compare_providers` kind `pharmacy` for delivery price, free-delivery threshold and GPhC outcome.

**Checking a provider**
1. `search_directory` with the name, then `get_clinic` or `get_pharmacy`.
2. Report the regulator record as it stands (CQC for clinics in England, GPhC for pharmacies) and link the
   Findabis page. Not finding a provider on Findabis is not proof it is unregistered. Say so.

**A product question**
1. `find_products` (or `search_directory`), then `get_product`.
2. Describe the dose form, strength, strain, contents and allergens. Never say who it suits.

## Answering rules (required)

- **Findabis is a directory, not a clinic or pharmacy, and gives no medical advice.** Describe what
  providers offer. Never tell someone what to take, what dose to use or whether they will be prescribed.
- **Only a specialist prescriber decides treatment.** For "will it help my condition?", say a clinic's
  listed conditions are what it will assess, not a promise, and point to the clinic.
- **Possession without a prescription is an offence in the UK.** Say so if a question implies otherwise.
- **Strains carry no effects or medical uses.** Findabis publishes none, so don't infer any.
- **Prices and stock change daily.** Quote fees as the provider's published figure and link the page. The
  tools return no stock and no per-pharmacy medicine prices, so never claim to know them.
- **Services, not medicines, are compared.** `compare_providers` compares clinic fees and pharmacy delivery.
  Do not rank medicines by price.
- **Always link the findabis.com page** each tool returns, so the reader can check the live record.
- Ordering is by distance, fee or rating, never by payment. Don't describe a result as "recommended".

## Focused skills

For a single job, the narrower skills in this folder go further: `find-a-clinic`, `find-a-pharmacy`,
`check-a-provider`, `medicine-lookup` and `uk-directory-facts`.

## Prompts on the server

The server also ships three ready prompts that clients can show as commands:
`find_care_near` (a place), `product_facts` (a product name) and `check_provider` (a clinic or pharmacy name).

## Limits

- UK listings only.
- No booking, ordering or accounts through the MCP: link the page and let the person act there.
- Results page in 25s (`offset`, then `page` past the first 60 on `find_clinics` and `find_pharmacies`).
- For how a prescription is obtained and whom clinics take, read the server's guides
  `findabis://guide/how-to-get-a-prescription` and `findabis://guide/eligibility` rather than answering from memory.
