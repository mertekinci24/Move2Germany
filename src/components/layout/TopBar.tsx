
import { Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { configLoader } from '../../lib/config';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';

type TopBarProps = {
  selectedCity: string;
  selectedTimeWindow: string;
  searchQuery: string;
  onCityChange: (cityId: string) => void;
  onTimeWindowChange: (timeWindowId: string) => void;
  onSearchChange: (query: string) => void;
};

export function TopBar({
  selectedCity,
  selectedTimeWindow,
  searchQuery,
  onCityChange,
  onTimeWindowChange,
  onSearchChange
}: TopBarProps) {
  const { user, signOut } = useAuth();
  const { t } = useI18n();

  const cities = configLoader.getCities();
  const timeWindows = configLoader.getTimeWindows();

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {cities.map(city => (
              <option key={city.id} value={city.id}>{city.name}</option>
            ))}
          </select>

          <select
            value={selectedTimeWindow}
            onChange={(e) => onTimeWindowChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {timeWindows.map(tw => (
              <option key={tw.id} value={tw.id}>{tw.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          <span className="text-sm text-gray-600">{user?.email}</span>
          <button
            onClick={signOut}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t('auth.logout')}
          </button>
        </div>
      </div>
    </div>
  );
}
