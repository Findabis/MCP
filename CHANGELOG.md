# Changelog

Versions match the `version` the server reports in its handshake and on its
[registry card](https://findabis.com/.well-known/mcp/server.json).

## 0.7.0 — 2026-11 (draft: the owner signs the copy before `scripts/release.sh`)

- New `find_suppliers` and `get_supplier`: the cultivators, manufacturers and distributors listed on Findabis — roles,
  location, brands and product count, in name order (never by sponsorship). No stock or wholesale prices.
- New `find_creators` and `get_creator`: creators listed on Findabis — channels, recent videos and their shop link.
  Creators are never reviewed or rated, and their videos are not linked to medicines.
- New `get_travel_rules`: one country's checked rule for travelling with prescribed cannabis, with its sources and
  review date and nearby countries, or every country with one status. Not legal advice.
- New `explain_topic`: short, sourced explainers (prescribing, specialist checks, costs, driving, work and drug
  tests, switching, shortages, complaints…). Describes how things work; never advises anyone personally.
- New `find_provider_articles` and `get_provider_article`: articles clinics and pharmacies publish on their own
  Findabis pages (first published in this release).
- `find_strains` takes THC and CBD ranges, terpenes, flavours and "has products". No strain or product carries
  effects, uses or side effects, and the instructions now say never to infer them.
- `get_travel_rules` understands the usual spellings of country names (St Lucia, Côte d'Ivoire, Korea, Burma…) and
  suggests the closest checked names when one is not found.
- Resource templates `findabis://{clinic,pharmacy,product,strain,brand,supplier,creator}/{slug}`, and a lighter tool
  list: each `get_` tool now advertises only its own output shape.

## 0.6.0 — 2026-11

- One `find_` and one `get_` tool per kind. `get_listing` is replaced by `get_clinic`, `get_pharmacy`, `get_strain`
  and `get_brand`; each takes just the page `slug`.
- `search_findabis` is renamed `search_directory`.
- New `find_articles` and `get_article`: Findabis's published articles by topic or category, and the text of one
  (plain text, shortened past 6,000 characters, with its page link). A members-only article returns its link only.
- Leaner definitions: every tool description is one or two sentences with an `Example:` call, parameter
  descriptions are a few words, and the shared rules (no stock, no per-pharmacy prices) sit once in the instructions.
- Breaking: clients that saved the old tool names should re-list tools.

## 0.5.0 — 2026-11

- `search_findabis` answers "what is X" in one call: every hit carries a one-line summary (town, consultation types
  and first fee for a clinic; delivery and collection for a pharmacy; brand, dose form, THC and CBD for a product;
  genetics for a strain; country and product count for a brand), its slug is printed in the text, and Findabis
  articles are searched too.
- `get_listing` returns the page's own FAQs and opening hours (in-person and, for clinics, the online diary).
- New `get_directory_facts`: how many clinics, pharmacies, products, strains and brands are listed, the range and
  median of published first-consultation fees, how many pharmacies deliver or offer collection, and when each
  directory last changed. Aggregates only, each with its directory page.
- Two more prompts beside `find_care_near`: `product_facts` (a product name) and `check_provider` (a clinic or
  pharmacy name).
- The server's `instructions` now end with a short routing guide: which tool answers which question, that slugs come
  from the find tools, that lists cap at 25, that nothing is ordered by sponsorship, and that the guides exist.
- `llms.txt` and the GET probe count tools, guides and prompts from the code (`llms.txt` still said seven).
- README: diagrams for how it works, connecting Claude, which tool answers what, an example answer and what the
  server can and can't see (dark and light, drawn by `scripts/make-docs-images.py`); a "check it's working" step; a
  troubleshooting table; ChatGPT, GitHub Copilot and Windsurf steps to match findabis.com/mcp.

## 0.4.0 — 2026-10

- New `find_brands`: brands by name or dose form, with page link, location, website and how many products each
  lists. Sorted by name or product count, never by sponsorship.
- `offset` on `find_clinics`, `find_pharmacies`, `find_products`, `find_strains` and `find_brands` for the next
  page; every list answer says which offset comes next.
- `plugin.json` and `mcp.json` ([Agent Plugins](https://agent-plugins.org)) and `gemini-extension.json`, so Cursor
  and Gemini CLI can install the server from this repo.

## 0.3.0 — 2026-10

- Eight public, read-only tools: `find_clinics`, `find_pharmacies`, `find_products`, `get_product`,
  `find_strains`, `get_listing`, `compare_providers`, `search_findabis`.
- Every tool returns typed structured content alongside text.
- Medical disclaimer and answering rules sent as the server's `instructions`.
- Public rate limit: 60 requests per minute per client.
- Listed in the official MCP Registry as `com.findabis/findabis`.
