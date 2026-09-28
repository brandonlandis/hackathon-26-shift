import { useMemo, useState } from 'react';
import EmptyState from '../components/ui/empty-state';
import Panel from '../components/ui/panel';
import StatusChip from '../components/ui/status-chip';
import { addDays, effectiveAssignment, todayIso } from '../lib/schedule';
import { useAppStore } from '../store';
import type { Employee, TeamId } from '../types';

const parseRosterCsv = (text: string): Employee[] => {
  const lines = text.trim().split('\n').slice(1);
  return lines
    .map((line) => line.split(',').map((cell) => cell.trim()))
    .filter((parts) => parts.length >= 2)
    .map(([id, homeTeam]) => ({ id, homeTeam: homeTeam as TeamId }));
};

export default function TeamPage() {
  const { state, dispatch } = useAppStore();
  const [selectedId, setSelectedId] = useState('T1-01');
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [status, setStatus] = useState<'Leave' | 'Unavailable'>('Unavailable');
  const [note, setNote] = useState('');

  const teams = useMemo(() => ({
    T1: state.employees.filter((e) => e.homeTeam === 'T1'),
    T2: state.employees.filter((e) => e.homeTeam === 'T2'),
    T3: state.employees.filter((e) => e.homeTeam === 'T3'),
  }), [state.employees]);

  const selected = state.employees.find((e) => e.id === selectedId) ?? null;

  const selectedHistory = useMemo(() => {
    if (!selected) return { swaps: [], recalls: [], unavailability: [] };
    return {
      swaps: state.swaps.filter((swap) => swap.participantA === selected.id || swap.participantB === selected.id).slice(0, 8),
      recalls: state.recalls.filter((recall) => recall.candidateId === selected.id).slice(0, 8),
      unavailability: state.unavailability.filter((entry) => entry.employeeId === selected.id).slice(0, 8),
    };
  }, [selected, state.recalls, state.swaps, state.unavailability]);

  const exportCsv = () => {
    const rows = ['id,homeTeam', ...state.employees.map((e) => `${e.id},${e.homeTeam}`)].join('\n');
    const blob = new Blob([rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'shiftfair-roster.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const addUnavailability = () => {
    dispatch({
      type: 'add-unavailability',
      payload: {
        id: crypto.randomUUID(),
        employeeId: selectedId,
        startDate,
        endDate,
        status,
        note,
        approved: true,
        createdAt: new Date().toISOString(),
      },
    });
    dispatch({ type: 'log', payload: { event: 'Availability updated', after: `${selectedId}: ${status} ${startDate} to ${endDate}` } });
    setNote('');
  };

  return (
    <div className="space-y-4 animate-rise">
      <Panel title="Team Roster" subtitle="Three teams with 15 placeholder IDs each. CSV import can replace placeholder IDs.">
        <div className="grid gap-3 lg:grid-cols-3">
          {(['T1', 'T2', 'T3'] as const).map((team) => (
            <article key={team} className="rounded-xl border border-slate-200 p-3">
              <h4 className="text-sm font-semibold">Team {team.slice(1)}</h4>
              <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
                {teams[team].map((employee) => (
                  <button
                    key={employee.id}
                    onClick={() => setSelectedId(employee.id)}
                    className={`rounded px-2 py-1 text-left ${selectedId === employee.id ? 'bg-teal text-white' : 'bg-slate-100 text-slate-700'}`}
                  >
                    {employee.id}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <button onClick={exportCsv} className="rounded-lg border border-slate-300 px-3 py-2">Export CSV</button>
          <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2">
            Import CSV
            <input
              className="hidden"
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const parsed = parseRosterCsv(String(reader.result ?? ''));
                  if (parsed.length > 0) {
                    dispatch({ type: 'import-roster', payload: parsed });
                    dispatch({ type: 'log', payload: { event: 'Roster imported from CSV' } });
                  }
                };
                reader.readAsText(file);
              }}
            />
          </label>
        </div>
      </Panel>

      <Panel title="Availability / Leave" subtitle="Non-sensitive note only. Medical details must not be entered.">
        <div className="grid gap-2 md:grid-cols-6">
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {state.employees.map((e) => <option key={e.id} value={e.id}>{e.id}</option>)}
          </select>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <select value={status} onChange={(e) => setStatus(e.target.value as 'Leave' | 'Unavailable')} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="Unavailable">Unavailable</option>
            <option value="Leave">Leave</option>
          </select>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button onClick={addUnavailability} className="rounded-lg bg-teal px-3 py-2 text-sm font-semibold text-white">Save</button>
        </div>
      </Panel>

      <Panel title={`Member Profile: ${selected?.id ?? '-'}`} subtitle="Effective schedule and recent history.">
        {!selected ? (
          <EmptyState title="No employee selected" detail="Select a member from any team." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-700">Effective next 14 days</h4>
              <div className="space-y-1">
                {Array.from({ length: 14 }, (_, idx) => addDays(todayIso(), idx)).map((date) => {
                  const assignment = effectiveAssignment(state, selected, date);
                  return (
                    <div key={date} className="flex items-center justify-between rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
                      <span>{date}</span>
                      <StatusChip
                        label={`${assignment.shift} • ${assignment.label}`}
                        tone={assignment.label === 'Leave/unavailable' ? 'danger' : assignment.label === 'Pending' ? 'warn' : 'ok'}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="mb-2 font-semibold text-slate-700">Availability changes</p>
                {selectedHistory.unavailability.length === 0 ? (
                  <EmptyState title="No availability records" detail="No leave/unavailable periods found." />
                ) : (
                  selectedHistory.unavailability.map((entry) => (
                    <div key={entry.id} className="rounded-lg border border-slate-200 px-3 py-2">
                      <p className="font-medium">{entry.status}</p>
                      <p className="text-xs text-slate-500">{entry.startDate} to {entry.endDate}</p>
                    </div>
                  ))
                )}
              </div>
              <div>
                <p className="mb-2 font-semibold text-slate-700">Swap & recall history</p>
                {selectedHistory.swaps.length === 0 && selectedHistory.recalls.length === 0 ? (
                  <EmptyState title="No swap or recall history" detail="This member has no matching events yet." />
                ) : (
                  <div className="space-y-1">
                    {selectedHistory.swaps.map((swap) => <div key={swap.id} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs">Swap • {swap.status} • {swap.dateA}{swap.dateA !== swap.dateB ? ` / ${swap.dateB}` : ''}</div>)}
                    {selectedHistory.recalls.map((recall) => <div key={recall.id} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs">Recall • {recall.status} • {recall.date} {recall.shift}</div>)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
