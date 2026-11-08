import type { PublicMcpTool } from '@/server/mcp/registry';
import { findArticles, getArticle } from './article';
import { findBrands } from './brands';
import { findProducts, findStrains } from './catalogue';
import { findClinics } from './clinics';
import { compareProviders } from './compare';
import { getDirectoryFacts } from './facts';
import { getBrand, getClinic, getPharmacy, getStrain } from './listing';
import { findPharmacies } from './pharmacies';
import { getProduct } from './product';
import { searchAll } from './search';

/**
 * Everything a caller with no credential may use: a find_ and a get_ tool for
 * each kind (clinic, pharmacy, product, strain, brand, article), then the three
 * that cross kinds. One predictable name per job beats a `kind` argument a
 * model has to fill in. The order is the /docs table's (summary.ts).
 */
export const publicTools: PublicMcpTool[] = [
    findClinics,
    getClinic,
    findPharmacies,
    getPharmacy,
    findProducts,
    getProduct,
    findStrains,
    getStrain,
    findBrands,
    getBrand,
    findArticles,
    getArticle,
    compareProviders,
    searchAll,
    getDirectoryFacts,
];
