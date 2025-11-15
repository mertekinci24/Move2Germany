import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile } from '../../lib/auth';
import { initializeUserTasks } from '../../lib/tasks';
import { configLoader } from '../../lib/config';

export function OnboardingWizard() {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    primaryCityId: '',
    arrivalDate: '',
    personaType: 'student',
    germanLevel: 'A1',
    budgetRange: 'low'
  });

  const cities = configLoader.getCities();

  function handleChange(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!formData.primaryCityId || !formData.arrivalDate) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await updateProfile(user!.id, {
        primaryCityId: formData.primaryCityId,
        arrivalDate: formData.arrivalDate,
        personaType: formData.personaType,
        germanLevel: formData.germanLevel,
        budgetRange: formData.budgetRange,
        onboardingCompleted: true
      });

      await initializeUserTasks(user!.id, formData.primaryCityId);

      await refreshUser();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Move2Germany</h1>
        <p className="text-gray-600 mb-8">Let's set up your personalized 90-day plan</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Which city are you moving to? *
              </label>
              <select
                value={formData.primaryCityId}
                onChange={(e) => handleChange('primaryCityId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a city</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                When are you arriving? *
              </label>
              <input
                type="date"
                value={formData.arrivalDate}
                onChange={(e) => handleChange('arrivalDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!formData.primaryCityId || !formData.arrivalDate}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's your status?
              </label>
              <select
                value={formData.personaType}
                onChange={(e) => handleChange('personaType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="student">Student</option>
                <option value="worker">Worker / Expat</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's your German language level?
              </label>
              <select
                value={formData.germanLevel}
                onChange={(e) => handleChange('germanLevel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="A1">A1 - Beginner</option>
                <option value="A2">A2 - Elementary</option>
                <option value="B1">B1 - Intermediate</option>
                <option value="B2">B2 - Upper Intermediate</option>
                <option value="C1">C1 - Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's your monthly budget range?
              </label>
              <select
                value={formData.budgetRange}
                onChange={(e) => handleChange('budgetRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low (under €800)</option>
                <option value="medium">Medium (€800-€1200)</option>
                <option value="high">High (over €1200)</option>
              </select>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Setting up...' : 'Complete Setup'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
