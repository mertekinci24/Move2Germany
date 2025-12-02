export type ScamSeverity = 'high' | 'medium' | 'low';

export interface ScamPattern {
    id: string;
    pattern: RegExp;
    nameKey: string;
    descriptionKey: string;
    severity: ScamSeverity;
}

export interface ScamResult {
    riskLevel: 'safe' | 'suspicious' | 'high_risk';
    score: number;
    matches: ScamPattern[];
}

export const SCAM_PATTERNS: ScamPattern[] = [
    {
        id: 'payment',
        pattern: /(western union|moneygram|money gram|wire transfer|bank transfer only|cash app|venmo|zelle)/i,
        nameKey: 'scamDetector.patterns.payment.name',
        descriptionKey: 'scamDetector.patterns.payment.desc',
        severity: 'high'
    },
    {
        id: 'abroad',
        pattern: /(currently abroad|out of the country|cannot show the apartment|not in the country|missionary|diplomat)/i,
        nameKey: 'scamDetector.patterns.abroad.name',
        descriptionKey: 'scamDetector.patterns.abroad.desc',
        severity: 'high'
    },
    {
        id: 'keys',
        pattern: /(send the keys|mail the keys|keys will be posted|deposit before seeing)/i,
        nameKey: 'scamDetector.patterns.keys.name',
        descriptionKey: 'scamDetector.patterns.keys.desc',
        severity: 'high'
    },
    {
        id: 'proxy',
        pattern: /(for my daughter|for my son|renting for a friend|on behalf of)/i,
        nameKey: 'scamDetector.patterns.proxy.name',
        descriptionKey: 'scamDetector.patterns.proxy.desc',
        severity: 'medium'
    },
    {
        id: 'tooGood',
        pattern: /(luxury apartment.*cheap|fully furnished.*low price|all included.*(300|400|500)\s*€)/i,
        nameKey: 'scamDetector.patterns.tooGood.name',
        descriptionKey: 'scamDetector.patterns.tooGood.desc',
        severity: 'medium'
    },
    {
        id: 'email',
        pattern: /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i,
        nameKey: 'scamDetector.patterns.email.name',
        descriptionKey: 'scamDetector.patterns.email.desc',
        severity: 'low'
    }
];

export function analyzeScamRisk(text: string): ScamResult {
    if (!text || text.trim().length < 10) {
        return {
            riskLevel: 'safe',
            score: 0,
            matches: []
        };
    }

    const matches: ScamPattern[] = [];
    let score = 0;

    SCAM_PATTERNS.forEach(pattern => {
        if (pattern.pattern.test(text)) {
            matches.push(pattern);
            if (pattern.severity === 'high') score += 50;
            if (pattern.severity === 'medium') score += 25;
            if (pattern.severity === 'low') score += 10;
        }
    });

    // Cap score at 100
    score = Math.min(score, 100);

    let riskLevel: ScamResult['riskLevel'] = 'safe';
    if (score >= 50) riskLevel = 'high_risk';
    else if (score >= 25) riskLevel = 'suspicious';

    return {
        riskLevel,
        score,
        matches
    };
}
