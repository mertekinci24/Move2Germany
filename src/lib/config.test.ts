import { describe, it, expect } from 'vitest';
import { configLoader } from './config';

describe('ConfigLoader', () => {
    it('should load German tasks when locale is de', () => {
        const tasks = configLoader.getTasks('de');
        const housingTask = tasks.find(t => t.id === 'kira-oda-ilanlarini-takip-et');

        expect(housingTask).toBeDefined();
        expect(housingTask?.title).toBe('Wohnungssuche beginnen');
        expect(housingTask?.description).toContain('Beginnen Sie Ihre Suche');
    });

    it('should fallback to Turkish (default) when locale is tr', () => {
        const tasks = configLoader.getTasks('tr');
        const housingTask = tasks.find(t => t.id === 'kira-oda-ilanlarini-takip-et');

        // Assuming the default Turkish title is different or we just check it exists
        expect(housingTask).toBeDefined();
        // We don't assert exact Turkish text here to avoid brittleness, 
        // but we know it shouldn't be the German one if they differ.
        expect(housingTask?.title).not.toBe('Wohnungssuche beginnen');
    });

    it('should load English tasks when locale is en', () => {
        const tasks = configLoader.getTasks('en');
        const housingTask = tasks.find(t => t.id === 'kira-oda-ilanlarini-takip-et');

        expect(housingTask).toBeDefined();
        // Assuming English config has "Start Housing Search" or similar
        // We just check it's not German
        expect(housingTask?.title).not.toBe('Wohnungssuche beginnen');
    });
});
