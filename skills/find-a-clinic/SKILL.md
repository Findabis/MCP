---
name: find-a-clinic
description: Find and compare UK medical cannabis clinics with the Findabis MCP server — nearest clinics to a town or postcode, online/video clinics, clinics that see a stated condition, cheapest first consultation, estimated year-one cost, CQC rating, and side-by-side fee breakdowns. Use for "how do I get a prescription", "clinics near me", "which clinic is cheapest", "what will it cost me in a year".
license: MIT
metadata:
  server: https://findabis.com/api/mcp
---

# Find a UK medical cannabis clinic

In the UK only a specialist clinic can prescribe cannabis-based medicines. This skill finds the right
clinics for a person and explains what they will pay.

## Steps

1. **Work out what matters.** Place (town or postcode), whether video is fine, a condition if they named
   one, a budget for the first appointment, and whether they are a new patient, transferring, or a
   veteran or other patient type a clinic lists.
2. **Search.** `find_clinics` with:
   - `near` for a place (results come nearest first, with miles; `radiusMiles` to widen)
   - `consultationType: "online"` when video is fine
   - `condition` to keep clinics whose published policy lists it
   - `maxFirstConsultationFee`, `cqc`, `acceptingPatients: true`, `patientType`
   - `sort`: distance, year-one clinic fees, or rating
3. **Show three to five.** For each: name, town and distance, first and follow-up fees, estimated year-one
   clinic fees, consultation types, CQC rating, review score, and the findabis.com link.
4. **Cost over a year.** `compare_providers` kind `clinic` with 2–6 slugs and the person's
   `patientType`, `followUpsPerYear` and `prescriptionsPerYear` returns a line-by-line breakdown.
   These are clinic fees only. Medicine is paid separately at the pharmacy.
5. **One clinic in full.** `get_listing` kind `clinic`: opening hours, full price list, which patients
   its policy takes, partner pharmacies, CQC registration, and the page's own FAQs.
6. **Next step.** Tell them to apply on the clinic's page. After a prescription, a pharmacy dispenses it
   (see the find-a-pharmacy skill).

## Getting the wording right

- A condition on a clinic's list means the clinic will **assess** people with it, not that they will be
  prescribed. Eligibility is the prescriber's decision.
- Year-one figures are estimates built from published fees. Say "estimated" and link the clinic's page.
- A "guaranteed" prescription is a warning sign: a UK prescription follows a specialist assessment.

## Answering rules

- Findabis is a directory, not a clinic or pharmacy, and gives no medical advice. Describe what providers offer; never say what someone should take or whether they will be prescribed.
- Possession without a prescription is an offence in the UK. Say so if the question implies otherwise.
- Quote fees and prices as the provider's published figure and link the findabis.com page each tool returns; they change.
- Results are ordered by distance, fee or rating, never by payment. Never call a result "recommended".
