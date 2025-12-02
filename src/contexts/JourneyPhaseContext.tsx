import { createContext, useContext, useMemo, ReactNode } from 'react';
import { JourneyPhase } from '../lib/config';
import { computeCurrentPhase } from '../lib/journey';
import { configLoader } from '../lib/config';
import { useAuth } from './AuthContext';

type JourneyPhaseContextType = {
    currentPhase: JourneyPhase;
    allPhases: JourneyPhase[];
};

const JourneyPhaseContext = createContext<JourneyPhaseContextType | undefined>(undefined);

export function JourneyPhaseProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const allPhases = useMemo(() => configLoader.getJourneyPhases(), []);

    const currentPhase = useMemo(() => {
        return computeCurrentPhase(user?.arrivalDate || null, allPhases);
    }, [user?.arrivalDate, allPhases]);

    return (
        <JourneyPhaseContext.Provider value={{ currentPhase, allPhases }}>
            {children}
        </JourneyPhaseContext.Provider>
    );
}

export function useJourneyPhase() {
    const context = useContext(JourneyPhaseContext);
    if (!context) {
        throw new Error('useJourneyPhase must be used within JourneyPhaseProvider');
    }
    return context;
}
