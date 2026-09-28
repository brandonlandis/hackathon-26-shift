import { NavLink } from 'react-router-dom';

type NavItem = {
  to: string;
  label: string;
};

const navItems: NavItem[] = [
  { to: '/', label: 'Overview' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/swaps', label: 'Swaps' },
  { to: '/recalls', label: 'Recalls' },
  { to: '/team', label: 'Team & Members' },
  { to: '/settings', label: 'Settings' },
  { to: '/activity', label: 'Activity' },
];

type AppShellProps = {
  children: React.ReactNode;
  showDemoBanner: boolean;
  onResetDemo: () => void;
};

export default function AppShell({ children, showDemoBanner, onResetDemo }: AppShellProps) {
  return (
    <div className="min-h-screen text-ink">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 lg:grid-cols-[255px_1fr]">
        <aside className="border-b border-slate-200/80 bg-white/85 p-5 backdrop-blur lg:border-b-0 lg:border-r">
          <div className="animate-rise">
            <h1 className="text-xl font-extrabold tracking-tight">ShiftFair</h1>
            <p className="mt-1 text-xs text-slate-500">Central roster and fairness assistant</p>
          </div>

          <nav className="mt-6 space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2.5 text-sm transition ${
                    isActive ? 'bg-teal text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 space-y-3 text-xs">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
              Demo prototype persists changes in your browser only. Not secure multi-user synchronization.
            </div>
            {showDemoBanner && (
              <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-danger">
                Demo mode active. Set your true cycle Day 1 date in Settings.
              </div>
            )}
          </div>

          <button
            onClick={onResetDemo}
            className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Reset Demo Data
          </button>
        </aside>

        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
