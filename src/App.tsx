import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/app-shell';
import PageTitle from './components/ui/page-title';
import OverviewPage from './pages/overview-page';
import CalendarPage from './pages/calendar-page';
import SwapsPage from './pages/swaps-page';
import RecallsPage from './pages/recalls-page';
import TeamPage from './pages/team-page';
import SettingsPage from './pages/settings-page';
import ActivityPage from './pages/activity-page';
import { useAppStore } from './store';
import { todayIso } from './lib/schedule';

export default function App() {
  const { state, dispatch, isHydrating, hydrateError } = useAppStore();

  if (isHydrating) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 text-center shadow-panel">
          <p className="text-sm text-slate-500">Loading ShiftFair demo workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      showDemoBanner={state.settings.cycleDay1Date === null}
      onResetDemo={() => {
        dispatch({ type: 'reset' });
        dispatch({ type: 'log', payload: { event: 'Demo reset by manager' } });
      }}
    >
      <PageTitle
        title="Workforce Operations"
        subtitle={`Today: ${todayIso()}${hydrateError ? ' • Local data warning active' : ''}`}
      />

      {hydrateError && (
        <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{hydrateError}</div>
      )}

      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/swaps" element={<SwapsPage />} />
        <Route path="/recalls" element={<RecallsPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
