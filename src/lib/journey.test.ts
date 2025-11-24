import { describe, it, expect } from 'vitest';
import { computeCurrentPhase } from './journey';
import { JourneyPhase } from './config';

const mockPhases: JourneyPhase[] = [
    {
        id: 'pre_arrival',
        order: 1,
        minDaysFromArrival: -9999,
        maxDaysFromArrival: 0,
        labelKey: 'timeWindows.pre_arrival'
    },
    {
        id: 'week_1',
        order: 2,
        minDaysFromArrival: 1,
        maxDaysFromArrival: 7,
        labelKey: 'timeWindows.week_1'
    },
    {
        id: 'weeks_2_4',
        order: 3,
        minDaysFromArrival: 8,
        maxDaysFromArrival: 30,
        labelKey: 'timeWindows.weeks_2_4'
    }
];

describe('computeCurrentPhase', () => {
    const now = new Date('2023-10-15T12:00:00Z'); // Fixed "now"

    it('should return pre_arrival if arrival date is null', () => {
        const phase = computeCurrentPhase(null, mockPhases, now);
        expect(phase.id).toBe('pre_arrival');
    });

    it('should return pre_arrival if arrival date is in the future', () => {
        // Arrival: 2023-10-20 (5 days in future)
        const arrival = '2023-10-20';
        const phase = computeCurrentPhase(arrival, mockPhases, now);
        expect(phase.id).toBe('pre_arrival');
    });

    it('should return pre_arrival if arrival date is today', () => {
        // Arrival: 2023-10-15 (0 days diff)
        const arrival = '2023-10-15';
        const phase = computeCurrentPhase(arrival, mockPhases, now);
        expect(phase.id).toBe('pre_arrival');
    });

    it('should return week_1 if arrival was yesterday (1 day ago)', () => {
        // Arrival: 2023-10-14
        const arrival = '2023-10-14';
        const phase = computeCurrentPhase(arrival, mockPhases, now);
        expect(phase.id).toBe('week_1');
    });

    it('should return week_1 if arrival was 7 days ago', () => {
        // Arrival: 2023-10-08
        const arrival = '2023-10-08';
        const phase = computeCurrentPhase(arrival, mockPhases, now);
        expect(phase.id).toBe('week_1');
    });

    it('should return weeks_2_4 if arrival was 8 days ago', () => {
        // Arrival: 2023-10-07
        const arrival = '2023-10-07';
        const phase = computeCurrentPhase(arrival, mockPhases, now);
        expect(phase.id).toBe('weeks_2_4');
    });

    it('should return last phase if arrival was very long ago', () => {
        // Arrival: 2023-01-01 (months ago)
        const arrival = '2023-01-01';
        const phase = computeCurrentPhase(arrival, mockPhases, now);
        expect(phase.id).toBe('weeks_2_4'); // Last one in our mock
    });
});
