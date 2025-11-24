import { housingProviders, HousingProvider } from './config';

const CITY_CODES: Record<string, string> = {
    'aachen': '1',
    'berlin': '8',
    'munich': '90',
    'frankfurt': '41',
    'hamburg': '55',
    'cologne': '73',
    'stuttgart': '124',
    'dusseldorf': '30',
    'leipzig': '77',
    'dortmund': '26',
    'essen': '35',
    'bremen': '17',
    'dresden': '27',
    'hanover': '57',
    'nuremberg': '96',
    'duisburg': '29',
    'bochum': '14',
    'wuppertal': '138',
    'bielefeld': '11',
    'bonn': '15',
    'munster': '91'
};

export type HousingCriteria = {
    cityId?: string;
    maxRent?: number;
    minSize?: number;
    roomType?: string;
};

export function getHousingProvidersForCity(cityId: string): HousingProvider[] {
    return housingProviders.filter(p => p.enabled && p.cityIds.includes(cityId));
}

export function generateHousingUrl(
    provider: HousingProvider,
    criteria: HousingCriteria
): string | null {
    if (!provider || !provider.enabled) return null;

    let url = provider.urlTemplate;

    // City Logic
    if (criteria.cityId) {
        const citySlug = criteria.cityId.toLowerCase();
        url = url.replace(/{{citySlug}}/g, citySlug);

        // WG-Gesucht specific city codes
        const cityCode = CITY_CODES[citySlug] || '0';
        url = url.replace(/{{cityCode}}/g, cityCode);
    } else {
        // If no city, we can't generate a valid URL for most providers
        // But let's replace with empty or default to avoid ugly template strings
        url = url.replace(/{{citySlug}}/g, '');
        url = url.replace(/{{cityCode}}/g, '0');
    }

    // Rent Logic
    if (criteria.maxRent) {
        url = url.replace(/{{maxRent}}/g, criteria.maxRent.toString());
    } else {
        url = url.replace(/{{maxRent}}/g, '');
    }

    // Size Logic
    if (criteria.minSize) {
        url = url.replace(/{{minSize}}/g, criteria.minSize.toString());
    } else {
        url = url.replace(/{{minSize}}/g, '');
    }

    return url;
}

export function getHousingLinks(cityId: string, criteria?: Omit<HousingCriteria, 'cityId'>): { provider: HousingProvider, url: string | null }[] {
    const providers = getHousingProvidersForCity(cityId);
    return providers.map(p => ({
        provider: p,
        url: generateHousingUrl(p, { cityId, ...criteria })
    }));
}
