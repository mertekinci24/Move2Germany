import { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { analyzeScamRisk, ScamResult } from '../../lib/scamPatterns';
import { AlertTriangle, ShieldCheck, ShieldAlert, Search, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ScamDetector() {
    const { t } = useI18n();
    const [text, setText] = useState('');
    const [result, setResult] = useState<ScamResult | null>(null);

    const handleAnalyze = () => {
        if (!text.trim()) return;
        const analysis = analyzeScamRisk(text);
        setResult(analysis);
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'high_risk': return 'bg-red-50 text-red-700 border-red-200';
            case 'suspicious': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'safe': return 'bg-green-50 text-green-700 border-green-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getRiskIcon = (level: string) => {
        switch (level) {
            case 'high_risk': return <ShieldAlert className="w-12 h-12 text-red-500" />;
            case 'suspicious': return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
            case 'safe': return <ShieldCheck className="w-12 h-12 text-green-500" />;
            default: return <Search className="w-12 h-12 text-gray-400" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                        <ShieldCheck className="w-6 h-6 mr-2 text-blue-600" />
                        {t('scamDetector.title')}
                    </h2>
                    <p className="text-gray-600 mt-1">
                        {t('scamDetector.subtitle')}
                    </p>
                </div>

                <div className="space-y-4">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={t('scamDetector.placeholder')}
                        className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />

                    <button
                        onClick={handleAnalyze}
                        disabled={!text.trim()}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        <Search className="w-4 h-4 mr-2" />
                        {t('scamDetector.analyze')}
                    </button>
                </div>
            </div>

            {result && (
                <div className={cn("p-6 rounded-lg border animate-in fade-in slide-in-from-top-4 duration-500", getRiskColor(result.riskLevel))}>
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                            {getRiskIcon(result.riskLevel)}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold capitalize mb-1">
                                {t(`scamDetector.riskLevel.${result.riskLevel}`)}
                            </h3>
                            <p className="text-sm opacity-90 mb-4">
                                {t('scamDetector.score')}: {result.score}/100
                            </p>

                            {result.matches.length > 0 && (
                                <div className="space-y-3">
                                    <p className="font-medium text-sm uppercase tracking-wider opacity-75">
                                        {t('scamDetector.detectedIssues')}
                                    </p>
                                    <ul className="space-y-2">
                                        {result.matches.map((match) => (
                                            <li key={match.id} className="flex items-start text-sm bg-white/50 p-2 rounded">
                                                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                                <span>
                                                    <strong>{t(match.nameKey)}:</strong> {t(match.descriptionKey)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {result.riskLevel === 'safe' && (
                                <p className="mt-4 text-sm">
                                    {t('scamDetector.safeMessage')}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                <p className="flex items-start">
                    <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    {t('scamDetector.disclaimer')}
                </p>
            </div>
        </div>
    );
}
