import { JourneyPhase } from './config';

export function computeCurrentPhase(
    arrivalDate: string | null,
    journeyPhases: JourneyPhase[],
    now: Date = new Date()
): JourneyPhase {
    // 1. Sort phases by order just in case
    const sortedPhases = [...journeyPhases].sort((a, b) => a.order - b.order);
    const defaultPhase = sortedPhases[0]; // Usually pre_arrival

    // 2. If no arrival date, return default (pre_arrival)
    if (!arrivalDate) {
        return defaultPhase;
    }

    // 3. Calculate days difference
    // arrivalDate is YYYY-MM-DD
    const arrival = new Date(arrivalDate);

    // Reset times to midnight for accurate day calculation
    const arrivalMidnight = new Date(Date.UTC(arrival.getFullYear(), arrival.getMonth(), arrival.getDate()));
    const nowMidnight = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    const diffTime = nowMidnight.getTime() - arrivalMidnight.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // 4. Find matching phase
    const matchingPhase = sortedPhases.find(phase => {
        const min = phase.minDaysFromArrival;
        const max = phase.maxDaysFromArrival;

        if (max === null) {
            // Open-ended phase (e.g. "Year 1+")
            return diffDays >= min;
        }

        return diffDays >= min && diffDays <= max;
    });

    // 5. Fallback logic
    if (matchingPhase) {
        return matchingPhase;
    }

    // If before the first phase (e.g. extremely early), return first phase
    if (diffDays < sortedPhases[0].minDaysFromArrival) {
        return sortedPhases[0];
    }

    // If after the last phase, return the last phase
    return sortedPhases[sortedPhases.length - 1];
}
