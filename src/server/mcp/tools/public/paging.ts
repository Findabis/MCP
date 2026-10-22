import { z } from 'zod';

/** The most a list tool returns at once */
export const MAX_LIMIT = 25;

export const limitInput = z
    .number()
    .int()
    .min(1)
    .max(MAX_LIMIT)
    .optional()
    .describe(`How many to return, 1-${MAX_LIMIT}. Default 10.`);

/** Capped: a few pages in, a filter is the better answer than another page */
export const offsetInput = z
    .number()
    .int()
    .min(0)
    .max(500)
    .optional()
    .describe('Skip this many results, for the next page (the answer says which offset comes next). Default 0.');

/**
 * The public list procedures clamp `perPage` (products and brands to 12-60),
 * so asking for `limit` rows at page `offset / limit` lands on the wrong rows.
 * Read fixed pages of MAX_LIMIT instead: a window of at most MAX_LIMIT rows
 * spans at most two of them.
 */
export async function readWindow<T>(
    offset: number,
    limit: number,
    fetchPage: (page: number, perPage: number) => Promise<{ items?: T[]; total?: number }>,
): Promise<{ items: T[]; total: number }> {
    const first = Math.floor(offset / MAX_LIMIT) + 1;
    const last = Math.floor((offset + limit - 1) / MAX_LIMIT) + 1;
    const pages = await Promise.all(
        Array.from({ length: last - first + 1 }, (_, i) => fetchPage(first + i, MAX_LIMIT)),
    );
    const rows = pages.flatMap((p) => p.items ?? []);
    const start = offset - (first - 1) * MAX_LIMIT;
    return { items: rows.slice(start, start + limit), total: Number(pages[0]?.total ?? rows.length) };
}
