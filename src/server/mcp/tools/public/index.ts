import type { PublicMcpTool } from '@/server/mcp/registry';
import { findProducts, findStrains } from './catalogue';
import { findClinics } from './clinics';
import { compareProviders } from './compare';
import { getListing } from './listing';
import { findPharmacies } from './pharmacies';
import { getProduct } from './product';
import { searchAll } from './search';

/**
 * Everything a caller with no credential may use. Eight tools, deliberately:
 * a model picks the right tool far less reliably as the list grows, so one
 * tool with a filter (or a `kind`) beats three near-identical ones. The order
 * is the /docs table's (summary.ts).
 */
export const publicTools: PublicMcpTool[] = [
    findClinics,
    findPharmacies,
    findProducts,
    getProduct,
    findStrains,
    getListing,
    compareProviders,
    searchAll,
];
