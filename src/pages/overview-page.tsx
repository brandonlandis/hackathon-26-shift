import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MetricCard from '../components/ui/metric-card';
import Panel from '../components/ui/panel';
import StatusChip from '../components/ui/status-chip';
import { useAppStore } from '../store';
import { anchorDate, cycleDay, headcount, restTeamForDate, todayIso } from '../lib/schedule';

export default function OverviewPage() {
  const { state } = useAppStore();
  const [date, setDate] = useState(todayIso());

  const data = useMemo(() => {
    const counts = headcount(state, date);
    const pendingSwaps = state.swaps.filter((s) => s.status === 'Draft' || s.status === 'Awaiting consent').length;
    const pendingRecalls = state.recalls.filter((r) => r.status === 'Offered' || r.status === 'Accepted').length;
    const absences = state.unavailability.filter((u) => u.approved && date >= u.startDate && date <= u.endDate);

    return {
      ...counts,
      pendingSwaps,
      pendingRecalls,
      absences,
      cycle: cycleDay(date, anchorDate(state)),
      restTeam: restTeamForDate(state, date),
    };
  }, [date, state]);

  return (
    <div className="space-y-4 animate-rise">
      <Panel
        title="Daily Snapshot"
        subtitle="Review coverage and fairness before approving schedule changes."
        actions={<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />}
      >
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span>Cycle Day {data.cycle}</span>
          <span>•</span>
          <span>Rest team: {data.restTeam}</span>
          <span>•</span>
          <span>Minimum staffing: {data.min} per shift</span>
        </div>
      </Panel>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Morning Headcount"
          value={`${data.morning} / ${data.min}`}
          hint={data.morningShort > 0 ? `${data.morningShort} short` : 'Covered'}
          tone={data.morningShort > 0 ? 'danger' : 'ok'}
        />
        <MetricCard
          title="Afternoon Headcount"
          value={`${data.afternoon} / ${data.min}`}
          hint={data.afternoonShort > 0 ? `${data.afternoonShort} short` : 'Covered'}
          tone={data.afternoonShort > 0 ? 'danger' : 'ok'}
        />
        <MetricCard title="Pending Swaps" value={String(data.pendingSwaps)} hint="Awaiting consent/approval" tone="warn" />
        <MetricCard title="Pending Recalls" value={String(data.pendingRecalls)} hint="Offer pipeline" tone="warn" />
      </section>

      {(data.morningShort > 0 || data.afternoonShort > 0) && (
        <Panel>
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-danger">
            <p className="font-semibold">Shortage alert</p>
            <p className="mt-1 text-sm">Coverage is below minimum. Start recall from the rest-team pool and complete confirmation before shift handover.</p>
          </div>
        </Panel>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="Quick Actions" subtitle="Fast path to most frequent manager workflows.">
          <div className="flex flex-wrap gap-2 text-sm">
            <Link to="/swaps" className="rounded-lg bg-teal px-3 py-2 font-medium text-white transition hover:brightness-95">Create swap</Link>
            <Link to="/recalls" className="rounded-lg bg-amber px-3 py-2 font-medium text-white transition hover:brightness-95">Start recall</Link>
            <Link to="/team" className="rounded-lg border border-slate-300 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50">Mark unavailable</Link>
          </div>
        </Panel>

        <Panel title="Absence & Unavailability" subtitle="Approved records only. No sensitive details stored.">
          {data.absences.length === 0 ? (
            <p className="text-sm text-slate-600">No approved unavailability records on this date.</p>
          ) : (
            <ul className="space-y-2">
              {data.absences.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                  <span className="font-mono text-sm">{a.employeeId}</span>
                  <StatusChip label={a.status} tone="warn" />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>
    </div>
  );
}
