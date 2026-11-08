---
name: find-a-pharmacy
description: Find UK pharmacies that dispense cannabis-based medicines with the Findabis MCP server — nearest pharmacies, home delivery and its price, free-delivery thresholds, in-person collection, GPhC registration and inspection outcome, and side-by-side comparison. Use when someone already has (or is about to get) a private prescription and asks where to fill it, who delivers, or which pharmacy is cheapest to deliver.
license: MIT
metadata:
  server: https://findabis.com/api/mcp
---

# Find a pharmacy for a cannabis prescription

A pharmacy dispenses a prescription a clinic has already issued; it cannot prescribe. Many clinics send
prescriptions to a partner pharmacy, so check the clinic's partners first.

## Steps

1. **Partner pharmacies first.** If the person has a clinic, `get_listing` kind `clinic` lists its
   partner pharmacies.
2. **Search.** `find_pharmacies` with `near` (nearest first, with miles), `delivers: true` for home
   delivery, `collection: true` to collect in person, `minRating`.
3. **Compare.** `compare_providers` kind `pharmacy` with 2–6 slugs: delivery and its cheapest price,
   free-delivery threshold, collection, GPhC registration and inspection outcome, reviews.
4. **One pharmacy in full.** `get_listing` kind `pharmacy`: address, opening hours, delivery prices,
   GPhC record, partner clinics, FAQs.

## What the tools do not tell you

Stock, which products a pharmacy holds and per-pharmacy medicine prices are shown only to patients and
professionals with access on findabis.com. Never claim a pharmacy has a product in stock or quote what it
charges for one. Send the person to the pharmacy page to check.

## Answering rules

- Findabis is a directory, not a clinic or pharmacy, and gives no medical advice. Describe what providers offer; never say what someone should take or whether they will be prescribed.
- Possession without a prescription is an offence in the UK. Say so if the question implies otherwise.
- Quote fees and prices as the provider's published figure and link the findabis.com page each tool returns; they change.
- Results are ordered by distance, fee or rating, never by payment. Never call a result "recommended".
