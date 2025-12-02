import React from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { getVisibleLocales, getLocaleMeta } from '../../lib/i18n';

export const LanguageSelector: React.FC<{ className?: string }> = ({ className = '' }) => {
    const { locale, setLocale } = useI18n();
    const visibleLocales = getVisibleLocales();

    return (
        <div className={`flex gap-2 ${className}`}>
            {visibleLocales.map((l) => {
                const meta = getLocaleMeta(l);
                const isActive = locale === l;
                return (
                    <button
                        key={l}
                        onClick={() => setLocale(l)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${isActive
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        aria-label={`Switch to ${meta.label}`}
                        aria-current={isActive ? 'true' : undefined}
                    >
                        {meta.nativeLabel}
                    </button>
                );
            })}
        </div>
    );
};
