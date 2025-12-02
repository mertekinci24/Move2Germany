import { describe, it, expect } from 'vitest';
import { analyzeScamRisk } from './scamPatterns';

describe('analyzeScamRisk', () => {
    it('should return low risk for safe text', () => {
        const text = "This is a lovely apartment in Berlin. Viewing is possible on weekends.";
        const result = analyzeScamRisk(text);
        expect(result.riskLevel).toBe('safe');
        expect(result.score).toBe(0);
        expect(result.matches).toHaveLength(0);
    });

    it('should detect Western Union scam', () => {
        const text = "Please send the deposit via Western Union before arrival.";
        const result = analyzeScamRisk(text);
        expect(result.matches.some(m => m.id === 'payment')).toBe(true);
        expect(result.score).toBeGreaterThan(0);
    });

    it('should detect landlord abroad scam', () => {
        const text = "I am currently out of the country, so I cannot show you the flat personally.";
        const result = analyzeScamRisk(text);
        expect(result.matches.some(m => m.id === 'abroad')).toBe(true);
    });

    it('should return high risk for multiple patterns', () => {
        const text = "I am currently abroad. Please send money via Western Union. The price is very cheap.";
        const result = analyzeScamRisk(text);
        expect(result.riskLevel).toBe('high_risk');
        expect(result.matches.length).toBeGreaterThan(1);
    });
});
