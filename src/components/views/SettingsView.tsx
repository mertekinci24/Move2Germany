import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile, changePassword, deleteAccount } from '../../lib/auth';
import { configLoader } from '../../lib/config';
import { useI18n } from '../../contexts/I18nContext';
import { VISIBLE_LOCALES, getLocaleMeta } from '../../lib/i18n';

export function SettingsView() {
  const { user, refreshUser } = useAuth();
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [profileData, setProfileData] = useState({
    locale: user?.locale || 'en',
    primaryCityId: user?.primaryCityId || '',
    arrivalDate: user?.arrivalDate || '',
    personaType: user?.personaType || 'student',
    germanLevel: user?.germanLevel || 'A1',
    budgetRange: user?.budgetRange || 'medium'
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const cities = configLoader.getCities();

  async function handleProfileSave() {
    if (!user) return;

    setSaving(true);
    setMessage('');
    setError('');

    try {
      await updateProfile(user.id, profileData);
      await refreshUser();
      setMessage(t('settings.success.profile'));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError(t('settings.error.passwordMatch'));
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError(t('settings.error.passwordLength'));
      return;
    }

    setSaving(true);
    setMessage('');
    setError('');

    try {
      await changePassword(passwordData.newPassword);
      setMessage(t('settings.success.password'));
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!user) return;

    if (!confirm(t('settings.deleteConfirm'))) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      await deleteAccount(user.id);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('settings.title')}</h1>
        <p className="text-gray-600 mt-2">{t('settings.subtitle')}</p>
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow space-y-6">
        <h2 className="text-xl font-bold text-gray-900">{t('settings.profileInfo')}</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.email')}</label>
          <input
            type="email"
            value={user?.email}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.language')}</label>
          <select
            value={profileData.locale}
            onChange={(e) => setProfileData(prev => ({ ...prev, locale: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {VISIBLE_LOCALES.map(locale => {
              const meta = getLocaleMeta(locale);
              return (
                <option key={locale} value={locale}>
                  {meta.nativeLabel}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.city')}</label>
          <select
            value={profileData.primaryCityId}
            onChange={(e) => setProfileData(prev => ({ ...prev, primaryCityId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {cities.map(city => (
              <option key={city.id} value={city.id}>{city.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.arrivalDate')}</label>
          <input
            type="date"
            value={profileData.arrivalDate}
            onChange={(e) => setProfileData(prev => ({ ...prev, arrivalDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.status')}</label>
          <select
            value={profileData.personaType}
            onChange={(e) => setProfileData(prev => ({ ...prev, personaType: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="student">Student</option>
            <option value="worker">Worker / Expat</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.germanLevel')}</label>
          <select
            value={profileData.germanLevel}
            onChange={(e) => setProfileData(prev => ({ ...prev, germanLevel: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="A1">A1 - Beginner</option>
            <option value="A2">A2 - Elementary</option>
            <option value="B1">B1 - Intermediate</option>
            <option value="B2">B2 - Upper Intermediate</option>
            <option value="C1">C1 - Advanced</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.budgetRange')}</label>
          <select
            value={profileData.budgetRange}
            onChange={(e) => setProfileData(prev => ({ ...prev, budgetRange: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low (under €800)</option>
            <option value="medium">Medium (€800-€1200)</option>
            <option value="high">High (over €1200)</option>
          </select>
        </div>

        <button
          onClick={handleProfileSave}
          disabled={saving}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {saving ? t('settings.saving') : t('settings.saveProfile')}
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-6">
        <h2 className="text-xl font-bold text-gray-900">{t('settings.changePassword')}</h2>
        <p className="text-sm text-gray-600">
          {t('settings.passwordDesc')}
        </p>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.newPassword')}</label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              minLength={8}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{t('settings.minChars')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.confirmPassword')}</label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              minLength={8}
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? t('settings.changing') : t('settings.changePassword')}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-xl font-bold text-red-600">{t('settings.dangerZone')}</h2>
        <p className="text-sm text-gray-600">
          {t('settings.deleteAccountWarning')}
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={saving}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
        >
          {t('settings.deleteAccount')}
        </button>
      </div>
    </div>
  );
}
