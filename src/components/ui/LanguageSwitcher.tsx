import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { getVisibleLocales, getLocaleMeta } from '../../lib/i18n';

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const visibleLocales = getVisibleLocales();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Globe className="w-5 h-5" />
        <span className="hidden md:inline font-medium">
          {getLocaleMeta(locale).nativeLabel}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
            {visibleLocales.map((loc) => {
              const meta = getLocaleMeta(loc);
              return (
                <button
                  key={loc}
                  onClick={() => {
                    setLocale(loc);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                    locale === loc ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{meta.nativeLabel}</span>
                    {locale === loc && (
                      <span className="text-blue-600">✓</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{meta.label}</div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
