---
name: medicine-lookup
description: Look up cannabis-based medicines, strains and brands on the UK market with the Findabis MCP server — what a named product contains (dose form, THC/CBD strength, strain, terpenes, carrier oil, allergens, capsule shell), its leaflets and storage notes, its published UK price range, strain genetics and lineage, and which products a brand makes. Use for "what's in X", "is X indica or sativa", "what does brand Y make", "what oils/flower are available".
license: MIT
metadata:
  server: https://findabis.com/api/mcp
---

# Look up a medicine, strain or brand

## Products

1. `find_products` with `query` (product, brand or strain name), or `category` for a dose form
   (flower, oil, …), or `genetics`. Use `search_findabis` if you are unsure what the name is.
2. `get_product` with the slug: dose form and strength, strain and brand, terpenes, contents (carrier
   oil, allergens, capsule shell), dosage and storage notes, patient leaflets, FAQs, and the UK price
   range when Findabis publishes one.
3. Describe the product. **Never say who it suits, what it treats or what dose to take.** Being listed does
   not mean a person can be prescribed it.
4. Prices are the range UK pharmacies charged, naming no pharmacy. Stock, pack sizes on offer and which
   pharmacies hold it are not returned. Link the product page.

## Strains

1. `find_strains` by name or `genetics` (Indica, Sativa, Hybrid), then `get_listing` kind `strain` for
   cannabinoid ranges, terpenes, flavours, lineage and the products made from it.
2. A strain is a plant lineage, not something a pharmacy dispenses. For what can be prescribed, use the
   products made from it.
3. **Findabis publishes no effects, medical uses or side effects for strains.** Don't infer any, even from
   genetics or terpenes.

## Brands

`find_brands` by name or dose form, then `get_listing` kind `brand` (location, website, products) or
`find_products` with the brand name as `query`. A listing is not an endorsement.

## Answering rules

- Findabis is a directory, not a clinic or pharmacy, and gives no medical advice. Describe what providers offer; never say what someone should take or whether they will be prescribed.
- Possession without a prescription is an offence in the UK. Say so if the question implies otherwise.
- Quote fees and prices as the provider's published figure and link the findabis.com page each tool returns; they change.
- Results are ordered by distance, fee or rating, never by payment. Never call a result "recommended".
