import { describe, it, expect } from 'vitest';
import { getHousingLinks, generateHousingUrl } from './housing';
import { HousingProvider } from './config';

describe('Housing Logic', () => {
    it('should generate correct URL for WG-Gesucht in Berlin with city code', () => {
        const provider: HousingProvider = {
            id: 'wg_gesucht',
            cityIds: ['berlin'],
            type: 'wg',
            urlTemplate: 'https://www.wg-gesucht.de/wg-zimmer-in-{{citySlug}}.{{cityCode}}.0.1.0.html',
            labelKey: 'housing.providers.wg_gesucht',
            enabled: true
        };
        // Berlin city code is 8
        const url = generateHousingUrl(provider, { cityId: 'berlin' });
        expect(url).toContain('berlin.8.0.1.0.html');
    });

    it('should generate correct URL with maxRent and minSize criteria', () => {
        const provider: HousingProvider = {
            id: 'immobilienscout24',
            cityIds: ['berlin'],
            type: 'apartment',
            urlTemplate: 'https://www.immobilienscout24.de/Suche/de/{{citySlug}}/wohnung-mieten?price=-{{maxRent}}&livingspace={{minSize}}-',
            labelKey: 'housing.providers.immobilienscout24',
            enabled: true
        };

        const url = generateHousingUrl(provider, {
            cityId: 'berlin',
            maxRent: 1200,
            minSize: 40
        });

        expect(url).toContain('/berlin/');
        expect(url).toContain('price=-1200');
        expect(url).toContain('livingspace=40-');
    });

    it('should handle missing criteria gracefully by replacing with empty string', () => {
        const provider: HousingProvider = {
            id: 'test_provider',
            cityIds: ['berlin'],
            type: 'apartment',
            urlTemplate: 'https://test.com/search?rent={{maxRent}}&size={{minSize}}',
            labelKey: 'housing.providers.test',
            enabled: true
        };

        const url = generateHousingUrl(provider, { cityId: 'berlin' });

        expect(url).toContain('rent=&');
        expect(url).toContain('size=');
    });

    it('should return providers for a supported city', () => {
        const links = getHousingLinks('berlin');
        expect(links.length).toBeGreaterThan(0);
        expect(links[0].provider.id).toBeDefined();
        expect(links[0].url).toBeDefined();
    });

    it('should return empty list for unsupported city', () => {
        const links = getHousingLinks('unknown_city');
        expect(links).toHaveLength(0);
    });
});
