---
name: check-a-provider
description: Check whether a UK medical cannabis clinic or pharmacy is legitimate using the Findabis MCP server — is it listed, its CQC (clinic) or GPhC (pharmacy) registration, latest inspection outcome, published fees or delivery, and links to the regulator. Use for "is X legit", "is this clinic registered", "can I trust this pharmacy", or when a site offers prescriptions in a way that sounds wrong.
license: MIT
metadata:
  server: https://findabis.com/api/mcp
---

# Check a clinic or pharmacy

## Steps

1. **Find it.** `search_findabis` with the name (small misspellings still match). If several match,
   ask which town.
2. **Read the record.** `get_listing` with kind `clinic` or `pharmacy` and the slug: CQC registration
   and rating for a clinic, GPhC registration and inspection outcome for a pharmacy, address, fees or
   delivery, and the findabis.com and regulator links.
3. **Report plainly.** What the regulator record says today, with the date if given, and both links so
   the person can check for themselves.

## Getting the wording right

- **Not on Findabis is not proof of anything.** Say Findabis has no listing, and point to the CQC
  (cqc.org.uk) or GPhC (pharmacyregulation.org) register to check directly.
- Never call a provider safe or unsafe. Report the registration and inspection facts.
- Warning signs worth naming when they come up: a "guaranteed" prescription, no specialist consultation,
  selling cannabis without a prescription, or a pharmacy with no GPhC registration. In the UK, possession
  without a prescription is an offence.

## Answering rules

- Findabis is a directory, not a clinic or pharmacy, and gives no medical advice. Describe what providers offer; never say what someone should take or whether they will be prescribed.
- Possession without a prescription is an offence in the UK. Say so if the question implies otherwise.
- Quote fees and prices as the provider's published figure and link the findabis.com page each tool returns; they change.
- Results are ordered by distance, fee or rating, never by payment. Never call a result "recommended".
