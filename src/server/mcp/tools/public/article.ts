import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { articleUrl, linkLine } from '@/server/mcp/links';
import type { PublicMcpTool } from '@/server/mcp/registry';
import { McpToolError, summarise } from '@/server/mcp/registry';
import { plainText } from '@/utils/jsonLd/shared';
import { publicCaller } from './caller';
import { slugInput } from './listing';
import { limitInput, offsetInput } from './paging';
import { toolCopy } from './summary';

/**
 * The Findabis articles: the /blog list and one article, through the blog's
 * own public procedures, so the visibility rule (published, live, shown on
 * findabis.com, never staff help) is the page's and not a second copy. A
 * signed-in-only article lists as a card, as on /blog, but its body is not
 * served: the tool has no session, so it hands back the page link instead.
 */
const text = z.string().nullable();
const url = z.string().url().nullable();

const articleRow = z.object({
    title: z.string(),
    slug: z.string(),
    url,
    category: text,
    excerpt: text,
    publishedAt: text.describe('ISO date the article went live'),
    readingMinutes: z.number().int().nullable(),
    aiAssisted: z.boolean().describe('The page labels it AI-assisted'),
});
type ArticleRow = z.infer<typeof articleRow>;

const articleListOutput = { results: z.array(articleRow), total: z.number().int() };

/** The body is capped: a model needs the substance and the link, not a long page in its context */
const BODY_LIMIT = 6000;

const articleOutput = {
    ...articleRow.shape,
    author: text,
    updatedAt: text,
    tags: z.array(z.string()),
    body: z.string().describe(`The article as plain text, at most ${BODY_LIMIT} characters; the page has the rest`),
    truncated: z.boolean(),
};

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const isoDate = (v: unknown) => (v ? new Date(v as string).toISOString().slice(0, 10) : null);

export function toArticleRow(a: any): ArticleRow {
    return {
        title: String(a.title ?? ''),
        slug: String(a.slug ?? ''),
        url: articleUrl(a.slug),
        category: str(a.category?.name),
        excerpt: plainText(a.excerpt, 240) || null,
        publishedAt: isoDate(a.publishedAt),
        readingMinutes: typeof a.readingTime === 'number' ? a.readingTime : null,
        aiAssisted: Boolean(a.aiAssisted),
    };
}

const articleLine = (r: ArticleRow) =>
    `${r.title} [slug: ${r.slug}] — ${[r.category, r.publishedAt, r.aiAssisted && 'AI-assisted'].filter(Boolean).join(' · ')}${r.excerpt ? `\n  ${r.excerpt}` : ''}${linkLine(r.url)}`;

export const findArticles: PublicMcpTool = {
    ...toolCopy('find_articles'),
    inputSchema: {
        query: z.string().max(120).optional().describe('Words to look for in the title or text. Omit to browse.'),
        category: z
            .string()
            .max(80)
            .regex(/^[a-z0-9-]+$/i, 'A category slug')
            .optional()
            .describe('A blog category slug, as an earlier answer gave it, e.g. "guides".'),
        sort: z.enum(['newest', 'oldest']).optional().describe('newest (default) or oldest first.'),
        limit: limitInput,
        offset: offsetInput,
    },
    outputSchema: articleListOutput,
    scopes: ['public'],
    handler: async ({ query, category, sort = 'newest', limit = 10, offset = 0 }, ctx) => {
        const api = await publicCaller(ctx);
        const res = await api.learning.getArticles({
            search: query?.trim() || undefined,
            category,
            sort,
            limit,
            offset,
        });
        const results = res.articles.map(toArticleRow).filter((r) => r.slug);
        const body = summarise(results.map(articleLine), res.total, 'Narrow with `query` or `category`.', offset);
        const next = results.length ? '\nNext: get_article slug=… to read one.' : '';
        return { text: `${body}${next}`, structured: { results, total: res.total } };
    },
};

export const getArticle: PublicMcpTool = {
    ...toolCopy('get_article'),
    inputSchema: { slug: slugInput },
    outputSchema: articleOutput,
    scopes: ['public'],
    handler: async ({ slug }: { slug: string }, ctx) => {
        const api = await publicCaller(ctx);
        const page = await api.learning.getArticleBySlug({ slug }).catch((error: unknown) => {
            if (error instanceof TRPCError && error.code === 'FORBIDDEN') {
                throw new McpToolError(
                    `This article is for signed-in Findabis members; give the person the page instead: ${articleUrl(slug)}`,
                );
            }
            if (error instanceof TRPCError && error.code === 'NOT_FOUND') {
                throw new McpToolError(`No article with slug "${slug}". Use find_articles to find the slug.`);
            }
            throw error;
        });
        const full = plainText(page.content, Number.MAX_SAFE_INTEGER) ?? '';
        const truncated = full.length > BODY_LIMIT;
        const body = truncated ? `${full.slice(0, BODY_LIMIT).trimEnd()}…` : full;
        const structured = {
            ...toArticleRow(page),
            author: str(page.author?.name),
            updatedAt: isoDate(page.updatedAt),
            tags: page.tags.map((tag) => tag.name).filter(Boolean),
            body,
            truncated,
        };
        const head = [
            structured.title,
            [structured.category, structured.author && `by ${structured.author}`, structured.publishedAt]
                .filter(Boolean)
                .join(' · '),
            structured.aiAssisted && 'AI-assisted',
        ].filter(Boolean);
        const text = [
            ...head,
            '',
            body,
            truncated ? `\n(Shortened — the full article is on the page.)` : '',
            structured.url && `Page: ${structured.url}`,
        ]
            .filter((line) => line !== false && line !== null)
            .join('\n');
        return { text, structured };
    },
};
