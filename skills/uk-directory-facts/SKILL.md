---
name: uk-directory-facts
description: Quote live, dated figures about UK medical cannabis provision from the Findabis MCP server — how many prescribing clinics, dispensing pharmacies, products, strains and brands are listed, the range and median first-consultation fee, how many pharmacies deliver or offer collection, and when each directory last changed. Use for "how many clinics are there in the UK", "what does a first consultation usually cost", journalism, reports and explainers that need a citable number.
license: MIT
metadata:
  server: https://findabis.com/api/mcp
---

# Quote UK directory figures

1. Call `get_directory_facts` (no input). It returns the counts, the first-consultation fee range and
   median, delivery and collection counts, and when each directory last changed.
2. **Always give the date with the figure** and cite the source as
   "Findabis (findabis.com), [date]". For example: "Findabis lists N prescribing clinics in the UK
   (findabis.com, 7 November 2026)."
3. For a narrower question, count from the listing tools: `find_clinics` with `near` or
   `consultationType`, `find_pharmacies` with `delivers`.
4. The figures are what is **listed on Findabis**, which aims to cover every UK provider. Say "listed on
   Findabis" rather than "in the UK" when precision matters.
5. Aggregates name no provider and hold no medicine prices. Don't present the median fee as what any one
   clinic charges.

## Answering rules

- Findabis is a directory, not a clinic or pharmacy, and gives no medical advice. Describe what providers offer; never say what someone should take or whether they will be prescribed.
- Possession without a prescription is an offence in the UK. Say so if the question implies otherwise.
- Quote fees and prices as the provider's published figure and link the findabis.com page each tool returns; they change.
- Results are ordered by distance, fee or rating, never by payment. Never call a result "recommended".
