import type { z } from 'zod';
import { db } from '@/server/db';
import type { PublicMcpTool } from '@/server/mcp/registry';
import { clinicListingFacts, pharmacyListingFacts } from '@/server/utils/listingFacts';
import { absoluteUrl } from '@/utils/jsonLd/shared';
import { publicCaller } from './caller';
import { money } from './clinicRow';
import { factsOutput } from './outputs';
import { toolCopy } from './summary';

/**
 * Directory-wide figures: the ones the /clinics and /pharmacies "At a glance"
 * blocks print (server/utils/listingFacts, counted with the directory's own
 * where-clauses, so a figure never disagrees with the grid), plus how many
 * products, strains and brands are listed. Aggregates only — no row leaves
 * here, so nothing a row carries can.
 */
const COUNTRY = 'GB';

const NOTE =
    'Directory-wide counts and published figures only; they name no provider and hold no stock or medicine prices. Listings change daily: cite the date.';

type Output = { [K in keyof typeof factsOutput]: z.infer<(typeof factsOutput)[K]> };

const day = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null);

/** A list procedure's `total` from its first page; zero when the call fails, so one slow directory never fails the tool */
const totalOf = (call: Promise<{ total?: unknown } | null | undefined>) =>
    call.then((r) => Number(r?.total ?? 0)).catch(() => 0);

function render(o: Output): string {
    const c = o.clinics;
    const p = o.pharmacies;
    const fee = c?.firstConsultationFee;
    const span = fee
        ? `; first consultation ${money(fee.min)}–${money(fee.max)} where stated (${fee.stated} state one; median ${money(fee.median)})`
        : '';
    return [
        `Findabis UK directory, as of ${o.asOf}:`,
        c
            ? `Clinics: ${c.count} listed${span}${c.updatedAt ? `; last updated ${c.updatedAt}` : ''}\n  ${c.url}`
            : 'Clinics: figures unavailable right now',
        p
            ? `Pharmacies: ${p.count} listed; ${p.delivery} deliver, ${p.collection} offer collection${p.updatedAt ? `; last updated ${p.updatedAt}` : ''}\n  ${p.url}`
            : 'Pharmacies: figures unavailable right now',
        `Products: ${o.products.count} listed\n  ${o.products.url}`,
        `Strains: ${o.strains.count} profiles\n  ${o.strains.url}`,
        `Brands: ${o.brands.count} listed\n  ${o.brands.url}`,
        NOTE,
    ].join('\n');
}

export const getDirectoryFacts: PublicMcpTool = {
    ...toolCopy('get_directory_facts'),
    inputSchema: {},
    outputSchema: factsOutput,
    scopes: ['public'],
    handler: async (_input, ctx) => {
        const api = await publicCaller(ctx);
        const [clinics, pharmacies, products, strains, brands] = await Promise.all([
            clinicListingFacts(db, COUNTRY).catch(() => null),
            pharmacyListingFacts(db, COUNTRY).catch(() => null),
            totalOf(api.catalogProduct.getPagedWithPricing({ page: 1, perPage: 12, countryCode: COUNTRY })),
            totalOf(api.strain.getPagedStrains({ page: 1, perPage: 1, sort: 'az' })),
            totalOf(api.brand.getPagedBrands({ page: 1, perPage: 12, sort: 'name_asc' })),
        ]);
        const structured: Output = {
            asOf: day(new Date()) ?? '',
            country: COUNTRY,
            clinics: clinics
                ? {
                      count: clinics.count,
                      url: absoluteUrl('/clinics'),
                      firstConsultationFee: clinics.fees,
                      updatedAt: day(clinics.updatedAt),
                  }
                : null,
            pharmacies: pharmacies
                ? {
                      count: pharmacies.count,
                      url: absoluteUrl('/pharmacies'),
                      delivery: pharmacies.delivery,
                      collection: pharmacies.collection,
                      updatedAt: day(pharmacies.updatedAt),
                  }
                : null,
            products: { count: products, url: absoluteUrl('/products') },
            strains: { count: strains, url: absoluteUrl('/strains') },
            brands: { count: brands, url: absoluteUrl('/brands') },
            note: NOTE,
        };
        return { text: render(structured), structured };
    },
};
