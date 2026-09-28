import { useMemo, useState } from 'react';
import EmptyState from '../components/ui/empty-state';
import Panel from '../components/ui/panel';
import StatusChip from '../components/ui/status-chip';
import { useAppStore } from '../store';
import { addDays, effectiveAssignment, headcount, todayIso, toIsoDate } from '../lib/schedule';
import { fmtDateTime } from '../lib/format';
import type { AssignmentInfo, Employee, TeamId } from '../types';

type ViewMode = 'month' | 'roster';

type ShiftFilter = 'ALL' | 'MORNING' | 'AFTERNOON' | 'REST';
type StatusFilter = 'ALL' | AssignmentInfo['label'];

const labelTone = (label: AssignmentInfo['label']) => {
  if (label === 'Morning' || label === 'Afternoon' || label === 'Approved swap' || label === 'Recalled') return 'ok' as const;
  if (label === 'Pending') return 'warn' as const;
  if (label === 'Leave/unavailable') return 'danger' as const;
  return 'neutral' as const;
};

export default function CalendarPage() {
  const { state } = useAppStore();
  const [view, setView] = useState<ViewMode>('month');
  const [date, setDate] = useState(todayIso());
  const [team, setTeam] = useState<'ALL' | TeamId>('ALL');
  const [employeeId, setEmployeeId] = useState<'ALL' | string>('ALL');
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const monthDays = useMemo(() => {
    const start = new Date(`${date}T00:00:00`);
    const total = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    return Array.from({ length: total }, (_, idx) => toIsoDate(new Date(start.getFullYear(), start.getMonth(), idx + 1)));
  }, [date]);

  const rosterEmployees = useMemo(() => {
    return state.employees
      .filter((e) => (team === 'ALL' ? true : e.homeTeam === team))
      .filter((e) => (employeeId === 'ALL' ? true : e.id === employeeId));
  }, [employeeId, state.employees, team]);

  const filteredRows = useMemo(() => {
    return rosterEmployees.filter((employee) => {
      if (shiftFilter === 'ALL' && statusFilter === 'ALL') return true;
      const week = Array.from({ length: 7 }, (_, idx) => addDays(date, idx)).map((d) => effectiveAssignment(state, employee, d));
      const shiftMatch = shiftFilter === 'ALL' || week.some((slot) => slot.shift === shiftFilter);
      const statusMatch = statusFilter === 'ALL' || week.some((slot) => slot.label === statusFilter);
      return shiftMatch && statusMatch;
    });
  }, [date, rosterEmployees, shiftFilter, state, statusFilter]);

  const [selected, setSelected] = useState<Employee | null>(null);

  const selectedHistory = useMemo(() => {
    if (!selected) return { swaps: [], recalls: [] };
    return {
      swaps: state.swaps.filter((s) => s.participantA === selected.id || s.participantB === selected.id).slice(0, 6),
      recalls: state.recalls.filter((r) => r.candidateId === selected.id).slice(0, 6),
    };
  }, [selected, state.recalls, state.swaps]);

  return (
    <div className="space-y-4 animate-rise">
      <Panel title="Calendar" subtitle="Month and roster views with assignment status filtering.">
        <div className="grid gap-2 md:grid-cols-6">
          <div className="col-span-2 flex gap-2">
            <button onClick={() => setView('month')} className={`rounded-lg px-3 py-2 text-sm ${view === 'month' ? 'bg-teal text-white' : 'bg-slate-100 text-slate-700'}`}>Month</button>
            <button onClick={() => setView('roster')} className={`rounded-lg px-3 py-2 text-sm ${view === 'roster' ? 'bg-teal text-white' : 'bg-slate-100 text-slate-700'}`}>Roster</button>
          </div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <select value={team} onChange={(e) => setTeam(e.target.value as 'ALL' | TeamId)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="ALL">All teams</option>
            <option value="T1">Team 1</option>
            <option value="T2">Team 2</option>
            <option value="T3">Team 3</option>
          </select>
          <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value as 'ALL' | string)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="ALL">All employees</option>
            {state.employees
              .filter((e) => (team === 'ALL' ? true : e.homeTeam === team))
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.id}
                </option>
              ))}
          </select>
          <select value={shiftFilter} onChange={(e) => setShiftFilter(e.target.value as ShiftFilter)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="ALL">All shifts</option>
            <option value="MORNING">Morning</option>
            <option value="AFTERNOON">Afternoon</option>
            <option value="REST">Rest</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="ALL">All statuses</option>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
            <option value="Rest">Rest</option>
            <option value="Approved swap">Approved swap</option>
            <option value="Leave/unavailable">Leave/unavailable</option>
            <option value="Recalled">Recalled</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </Panel>

      {view === 'month' ? (
        <Panel subtitle="Daily coverage by date. Red indicates staffing below minimum.">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {monthDays.map((day) => {
              const c = headcount(state, day);
              const danger = c.morningShort > 0 || c.afternoonShort > 0;
              return (
                <article key={day} className={`rounded-xl border p-3 ${danger ? 'border-danger/40 bg-danger/5' : 'border-slate-200 bg-white'}`}>
                  <p className="text-sm font-semibold">{day}</p>
                  <p className="mt-1 text-xs text-slate-600">Morning: {c.morning}/{c.min}</p>
                  <p className="text-xs text-slate-600">Afternoon: {c.afternoon}/{c.min}</p>
                </article>
              );
            })}
          </div>
        </Panel>
      ) : (
        <Panel subtitle="Select an employee row to inspect individual calendar and change history.">
          {filteredRows.length === 0 ? (
            <EmptyState title="No matching employees" detail="Adjust filters or choose a different team/date." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-2 py-2">Employee</th>
                    {Array.from({ length: 7 }, (_, idx) => addDays(date, idx)).map((d) => (
                      <th key={d} className="px-2 py-2">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((employee) => (
                    <tr key={employee.id} className="border-b border-slate-100 hover:bg-slate-50/60 cursor-pointer" onClick={() => setSelected(employee)}>
                      <td className="px-2 py-2 font-mono font-medium">{employee.id}</td>
                      {Array.from({ length: 7 }, (_, idx) => addDays(date, idx)).map((d) => {
                        const slot = effectiveAssignment(state, employee, d);
                        return (
                          <td key={`${employee.id}-${d}`} className="px-2 py-2">
                            <StatusChip
                              tone={labelTone(slot.label)}
                              label={`${slot.shift === 'MORNING' ? 'M' : slot.shift === 'AFTERNOON' ? 'A' : 'R'} • ${slot.label}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {selected && (
        <Panel title={`Employee Detail: ${selected.id}`} subtitle={`Home team ${selected.homeTeam}`}>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-700">Next 14 days</h4>
              <div className="space-y-1 text-sm">
                {Array.from({ length: 14 }, (_, idx) => addDays(todayIso(), idx)).map((d) => {
                  const slot = effectiveAssignment(state, selected, d);
                  return (
                    <div key={d} className="flex items-center justify-between rounded-lg border border-slate-200 px-2 py-1.5">
                      <span>{d}</span>
                      <StatusChip label={`${slot.shift} • ${slot.label}`} tone={labelTone(slot.label)} />
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-700">Recent history</h4>
              <div className="space-y-2 text-sm">
                {selectedHistory.swaps.map((swap) => (
                  <div key={swap.id} className="rounded-lg border border-slate-200 px-3 py-2">
                    <p className="font-medium">Swap {swap.type === 'SAME_DATE' ? 'Same-date' : 'Date-for-date'} • {swap.status}</p>
                    <p className="text-xs text-slate-500">{swap.dateA}{swap.dateA !== swap.dateB ? ` / ${swap.dateB}` : ''}</p>
                  </div>
                ))}
                {selectedHistory.recalls.map((recall) => (
                  <div key={recall.id} className="rounded-lg border border-slate-200 px-3 py-2">
                    <p className="font-medium">Recall • {recall.status}</p>
                    <p className="text-xs text-slate-500">{recall.date} {recall.shift}</p>
                  </div>
                ))}
                {selectedHistory.swaps.length === 0 && selectedHistory.recalls.length === 0 && (
                  <EmptyState title="No recent events" detail="This employee has no swap or recall records yet." />
                )}
                <p className="text-xs text-slate-500">Last refreshed: {fmtDateTime(new Date().toISOString())}</p>
              </div>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
