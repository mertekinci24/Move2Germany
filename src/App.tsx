import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { SignupForm } from './components/auth/SignupForm';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { OverviewView } from './components/views/OverviewView';
import { ModuleView } from './components/views/ModuleView';
import { SettingsView } from './components/views/SettingsView';
import { AiChat } from './components/ai/AiChat';

function AppContent() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentView, setCurrentView] = useState('overview');
  const [selectedCity, setSelectedCity] = useState(user?.primaryCityId || 'berlin');
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<string>('pre_arrival');
  const [searchQuery, setSearchQuery] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return authMode === 'login' ? (
      <LoginForm onSwitchToSignup={() => setAuthMode('signup')} />
    ) : (
      <SignupForm onSwitchToLogin={() => setAuthMode('login')} />
    );
  }

  if (!user.onboardingCompleted) {
    return <OnboardingWizard />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          selectedCity={selectedCity}
          selectedTimeWindow={selectedTimeWindow}
          searchQuery={searchQuery}
          onCityChange={setSelectedCity}
          onTimeWindowChange={setSelectedTimeWindow}
          onSearchChange={setSearchQuery}
        />

        <div className="flex-1 overflow-y-auto">
          {currentView === 'overview' && (
            <OverviewView
              cityId={selectedCity}
              timeWindowId={selectedTimeWindow}
              searchQuery={searchQuery}
            />
          )}

          {currentView === 'housing' && (
            <ModuleView
              moduleId="housing"
              cityId={selectedCity}
              timeWindowId={selectedTimeWindow}
              searchQuery={searchQuery}
            />
          )}

          {currentView === 'bureaucracy' && (
            <ModuleView
              moduleId="bureaucracy"
              cityId={selectedCity}
              timeWindowId={selectedTimeWindow}
              searchQuery={searchQuery}
            />
          )}

          {currentView === 'work' && (
            <ModuleView
              moduleId="work"
              cityId={selectedCity}
              timeWindowId={selectedTimeWindow}
              searchQuery={searchQuery}
            />
          )}

          {currentView === 'social' && (
            <ModuleView
              moduleId="social"
              cityId={selectedCity}
              timeWindowId={selectedTimeWindow}
              searchQuery={searchQuery}
            />
          )}

          {currentView === 'settings' && <SettingsView />}
        </div>
      </div>

      <AiChat
        context={{
          cityId: selectedCity,
          timeWindowId: selectedTimeWindow,
          route: currentView
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
