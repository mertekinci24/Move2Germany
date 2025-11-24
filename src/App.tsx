import { useState, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { I18nProvider, useI18n } from './contexts/I18nContext';
import { LoginForm } from './components/auth/LoginForm';
import { SignupForm } from './components/auth/SignupForm';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { AppShell } from './components/ui/AppShell';
import { OverviewView } from './components/views/OverviewView';
import { ModuleView } from './components/views/ModuleView';
import { SettingsView } from './components/views/SettingsView';
import { AiChat } from './components/ai/AiChat';
import { Toaster, toast } from 'sonner';
import { computeCurrentPhase } from './lib/journey';
import { configLoader } from './lib/config';
import { useEffect } from 'react';

// Lazy load heavy views
const NotesView = lazy(() => import('./components/views/NotesView').then(module => ({ default: module.NotesView })));
const CalendarView = lazy(() => import('./components/views/CalendarView').then(module => ({ default: module.CalendarView })));
const CommunityView = lazy(() => import('./components/views/CommunityView').then(module => ({ default: module.CommunityView })));

function AppContent() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentView, setCurrentView] = useState('overview');
  const selectedCity = user?.primaryCityId || 'berlin';


  // Compute initial phase
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<string>(() => {
    const phases = configLoader.getJourneyPhases();
    const currentPhase = computeCurrentPhase(user?.arrivalDate || null, phases);
    return currentPhase.id;
  });

  const [searchQuery, setSearchQuery] = useState('');

  // One-time phase change toast
  useEffect(() => {
    if (!user) return;

    const phases = configLoader.getJourneyPhases();
    const currentPhase = computeCurrentPhase(user.arrivalDate || null, phases);

    // Check if we should show a toast
    const lastPhaseId = localStorage.getItem(`journey_last_phase_${user.id}`);

    if (lastPhaseId && lastPhaseId !== currentPhase.id) {
      // Phase changed!
      toast.success(t('journey.phaseChange.title') || 'New Phase Unlocked!', {
        description: t('journey.phaseChange.message', { phaseLabel: t(currentPhase.labelKey) }) || `Welcome to ${t(currentPhase.labelKey)}`
      });
    }

    // Update storage
    localStorage.setItem(`journey_last_phase_${user.id}`, currentPhase.id);

    // Also update state if needed (though we initialized it correctly)
    if (selectedTimeWindow !== currentPhase.id) {
      // Only auto-update if the user hasn't manually changed it in this session? 
      // Requirement says: "When they arrive fresh, or reload, initial phase must be computed".
      // We did that in useState initializer.
      // But if the user stays on the page for days (unlikely) or if we want to force update:
      // For now, let's respect the useState initializer.
    }
  }, [user, t]); // Run once per user load

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
    <AppShell
      sidebar={<Sidebar currentView={currentView} onViewChange={setCurrentView} />}
      topBar={
        <TopBar
          selectedCity={user?.primaryCityId || 'berlin'}
          selectedTimeWindow={selectedTimeWindow}
          searchQuery={searchQuery}
          onTimeWindowChange={setSelectedTimeWindow}
          onSearchChange={setSearchQuery}
        />
      }
      aiChat={
        <AiChat
          context={{
            cityId: selectedCity,
            timeWindowId: selectedTimeWindow,
            route: currentView
          }}
        />
      }
    >
      <Suspense fallback={<div className="p-6">Loading...</div>}>
        {currentView === 'overview' && (
          <OverviewView />
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

        {currentView === 'notes' && <NotesView userId={user.id} />}
        {currentView === 'calendar' && <CalendarView />}
        {currentView === 'community' && <CommunityView />}
        {currentView === 'settings' && <SettingsView />}
      </Suspense>
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <AppContent />
        <Toaster position="top-right" />
      </I18nProvider>
    </AuthProvider>
  );
}
