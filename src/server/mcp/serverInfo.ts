import { BASE_URL } from '@/utils/jsonLd/shared';
import { MCP_SERVER_DESCRIPTION } from './disclaimer';
import { MCP_SERVER_VERSION } from './registry';

/**
 * Who the public MCP says it is — in the initialize handshake (`serverInfo`)
 * and on the registry server card (/.well-known/mcp/server.json), which must
 * agree. No database imports: the card route reads this too.
 */
export const MCP_SERVER_TITLE = 'Findabis';

/** The PWA icons already served from /public, so a client draws the same mark the home screen does */
export const MCP_SERVER_ICONS = [
    { src: `${BASE_URL}/web-app-manifest-192x192.png`, mimeType: 'image/png', sizes: ['192x192'] },
    { src: `${BASE_URL}/web-app-manifest-512x512.png`, mimeType: 'image/png', sizes: ['512x512'] },
];

export const MCP_SERVER_INFO = {
    name: 'findabis',
    title: MCP_SERVER_TITLE,
    version: MCP_SERVER_VERSION,
    description: MCP_SERVER_DESCRIPTION,
    websiteUrl: BASE_URL,
    icons: MCP_SERVER_ICONS,
};
