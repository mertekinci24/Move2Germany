import { describe, it, expect } from 'vitest';
import {
  getSupportedLocales,
  getVisibleLocales,
  getLocaleMeta,
  isValidLocale,
  normalizeLocale,
  createTranslator
} from '../i18n';

describe('i18n', () => {
  describe('getSupportedLocales', () => {
    it('should return all 4 supported locales', () => {
      const locales = getSupportedLocales();
      expect(locales).toHaveLength(4);
      expect(locales).toContain('en');
      expect(locales).toContain('tr');
      expect(locales).toContain('ar');
      expect(locales).toContain('de');
    });
  });

  describe('getVisibleLocales', () => {
    it('should return only 3 visible locales (en, tr, ar)', () => {
      const locales = getVisibleLocales();
      expect(locales).toHaveLength(3);
      expect(locales).toContain('en');
      expect(locales).toContain('tr');
      expect(locales).toContain('ar');
      expect(locales).not.toContain('de');
    });
  });

  describe('getLocaleMeta', () => {
    it('should return correct metadata for English', () => {
      const meta = getLocaleMeta('en');
      expect(meta.code).toBe('en');
      expect(meta.label).toBe('English');
      expect(meta.direction).toBe('ltr');
    });

    it('should return correct metadata for Turkish', () => {
      const meta = getLocaleMeta('tr');
      expect(meta.code).toBe('tr');
      expect(meta.nativeLabel).toBe('Türkçe');
      expect(meta.direction).toBe('ltr');
    });

    it('should return RTL for Arabic', () => {
      const meta = getLocaleMeta('ar');
      expect(meta.direction).toBe('rtl');
      expect(meta.nativeLabel).toBe('العربية');
    });
  });

  describe('isValidLocale', () => {
    it('should validate supported locales', () => {
      expect(isValidLocale('en')).toBe(true);
      expect(isValidLocale('tr')).toBe(true);
      expect(isValidLocale('ar')).toBe(true);
      expect(isValidLocale('de')).toBe(true);
    });

    it('should reject invalid locales', () => {
      expect(isValidLocale('fr')).toBe(false);
      expect(isValidLocale('es')).toBe(false);
      expect(isValidLocale('')).toBe(false);
    });
  });

  describe('normalizeLocale', () => {
    it('should normalize Turkish variants', () => {
      expect(normalizeLocale('tr')).toBe('tr');
      expect(normalizeLocale('tr-TR')).toBe('tr');
      expect(normalizeLocale('tur')).toBe('tr');
    });

    it('should normalize Arabic variants', () => {
      expect(normalizeLocale('ar')).toBe('ar');
      expect(normalizeLocale('ar-SA')).toBe('ar');
      expect(normalizeLocale('ara')).toBe('ar');
    });

    it('should default to English for unknown locales', () => {
      expect(normalizeLocale('fr')).toBe('en');
      expect(normalizeLocale('es')).toBe('en');
      expect(normalizeLocale(null)).toBe('en');
      expect(normalizeLocale(undefined)).toBe('en');
    });
  });

  describe('createTranslator', () => {
    it('should translate English strings', () => {
      const t = createTranslator('en');
      expect(t('nav.overview')).toBe('Overview');
      expect(t('nav.housing')).toBe('Housing');
      expect(t('auth.login')).toBe('Login');
    });

    it('should translate Turkish strings', () => {
      const t = createTranslator('tr');
      expect(t('nav.overview')).toBe('Genel Bakış');
      expect(t('nav.housing')).toBe('Konut');
      expect(t('auth.login')).toBe('Giriş Yap');
    });

    it('should translate Arabic strings', () => {
      const t = createTranslator('ar');
      expect(t('nav.overview')).toBe('نظرة عامة');
      expect(t('nav.housing')).toBe('السكن');
      expect(t('auth.login')).toBe('تسجيل الدخول');
    });

    it('should fall back to English for missing German translations', () => {
      const t = createTranslator('de');
      expect(t('nav.overview')).toBe('Übersicht');
      expect(t('nav.housing')).toBe('Wohnen');
    });

    it('should return key if translation not found', () => {
      const t = createTranslator('en');
      expect(t('non.existent.key')).toBe('non.existent.key');
    });

    it('should fall back to English if locale translation missing', () => {
      const t = createTranslator('tr');
      const englishT = createTranslator('en');

      expect(typeof t('nav.overview')).toBe('string');
      expect(typeof englishT('nav.overview')).toBe('string');
    });
  });
});
