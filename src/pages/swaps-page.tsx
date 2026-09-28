import { useMemo, useState } from 'react';
import EmptyState from '../components/ui/empty-state';
import Panel from '../components/ui/panel';
import StatusChip from '../components/ui/status-chip';
import { agoLabel } from '../lib/format';
import {
  activeSwapOnDate,
  effectiveAssignment,
  fairnessForEmployee,
  headcount,
  simulateApprovedSwap,
  swapCoverageIssues,
  todayIso,
} from '../lib/schedule';
import { useAppStore } from '../store';
import type { ShiftType, SwapRequest, SwapType } from '../types';

type Candidate = {
  id: string;
  team: string;
  assignmentAtB: ShiftType;
  assignmentAtA: ShiftType;
  completedSwaps: number;
  completedRecalls: number;
  lastSwap: string | null;
  reason: string | null;
  projectedA: string;
  projectedB: string;
};

const asNumberForSort = (iso: string | null) => (iso ? new Date(iso).getTime() : 0);

export default function SwapsPage() {
  const { state, dispatch } = useAppStore();
  const [participantA, setParticipantA] = useState('T1-01');
  const [type, setType] = useState<SwapType>('SAME_DATE');
  const [dateA, setDateA] = useState(todayIso());
  const [dateB, setDateB] = useState(todayIso());
  const [participantB, setParticipantB] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selectedA = state.employees.find((e) => e.id === participantA);

  const candidates = useMemo<Candidate[]>(() => {
    if (!selectedA) return [];

    const effectiveDateB = type === 'SAME_DATE' ? dateA : dateB;
    const assignmentA = effectiveAssignment(state, selectedA, dateA);

    return state.employees
      .filter((employee) => employee.homeTeam !== selectedA.homeTeam)
      .map((employee) => {
        const assignmentB = effectiveAssignment(state, employee, effectiveDateB);
        const assignmentForA = effectiveAssignment(state, employee, dateA);
        const fairness = fairnessForEmployee(state, employee.id);

        let reason: string | null = null;
        if (assignmentB.label === 'Leave/unavailable' || assignmentForA.label === 'Leave/unavailable') reason = 'Marked unavailable';
        else if (activeSwapOnDate(state, employee.id, effectiveDateB) || activeSwapOnDate(state, employee.id, dateA)) reason = 'Already in active swap';

        const draft: SwapRequest = {
          id: 'preview',
          type,
          status: 'Awaiting consent',
          participantA: selectedA.id,
          participantB: employee.id,
          dateA,
          dateB: effectiveDateB,
          fromA: assignmentA.shift,
          fromB: assignmentB.shift,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const simulated = simulateApprovedSwap(state, draft);
        const aCounts = headcount(simulated, dateA);
        const bCounts = headcount(simulated, effectiveDateB);

        return {
          id: employee.id,
          team: employee.homeTeam,
          assignmentAtB: assignmentB.shift,
          assignmentAtA: assignmentForA.shift,
          completedSwaps: fairness.completedSwaps,
          completedRecalls: fairness.completedRecalls,
          lastSwap: fairness.lastSwap,
          reason,
          projectedA: `${aCounts.morning}/${aCounts.min} M • ${aCounts.afternoon}/${aCounts.min} A`,
          projectedB: `${bCounts.morning}/${bCounts.min} M • ${bCounts.afternoon}/${bCounts.min} A`,
        };
      })
      .sort((a, b) => {
        if (a.reason && !b.reason) return 1;
        if (!a.reason && b.reason) return -1;
        if (a.completedSwaps !== b.completedSwaps) return a.completedSwaps - b.completedSwaps;
        return asNumberForSort(a.lastSwap) - asNumberForSort(b.lastSwap);
      });
  }, [dateA, dateB, selectedA, state, type]);

  const createSwap = () => {
    if (!selectedA || !participantB) return;

    const employeeB = state.employees.find((e) => e.id === participantB);
    if (!employeeB) return;

    const effectiveDateB = type === 'SAME_DATE' ? dateA : dateB;
    const assignmentA = effectiveAssignment(state, selectedA, dateA).shift;
    const assignmentB = effectiveAssignment(state, employeeB, effectiveDateB).shift;

    const request: SwapRequest = {
      id: crypto.randomUUID(),
      type,
      status: 'Awaiting consent',
      participantA,
      participantB,
      dateA,
      dateB: effectiveDateB,
      fromA: assignmentA,
      fromB: assignmentB,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch({ type: 'create-swap', payload: request });
    dispatch({ type: 'log', payload: { event: `Swap request created (${type})`, after: `${participantA} ↔ ${participantB} on ${dateA}${effectiveDateB !== dateA ? ` and ${effectiveDateB}` : ''}` } });
    setParticipantB('');
    setError(null);
  };

  return (
    <div className="space-y-4 animate-rise">
      <Panel title="Cross-team Swaps" subtitle="Fairness ranking: fewest completed swaps, then longest since last swap.">
        <div className="grid gap-2 md:grid-cols-6">
          <select value={participantA} onChange={(e) => setParticipantA(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {state.employees.map((e) => <option key={e.id} value={e.id}>{e.id} ({e.homeTeam})</option>)}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value as SwapType)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="SAME_DATE">Same-date exchange</option>
            <option value="DATE_FOR_DATE">Date-for-date exchange</option>
          </select>
          <input type="date" value={dateA} onChange={(e) => setDateA(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input type="date" disabled={type === 'SAME_DATE'} value={type === 'SAME_DATE' ? dateA : dateB} onChange={(e) => setDateB(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100" />
          <select value={participantB} onChange={(e) => setParticipantB(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Select ranked candidate</option>
            {candidates.filter((c) => !c.reason).map((c) => <option key={c.id} value={c.id}>{c.id} ({c.team}) • swaps {c.completedSwaps}</option>)}
          </select>
          <button onClick={createSwap} disabled={!participantB} className="rounded-lg bg-teal px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Create swap request</button>
        </div>
      </Panel>

      <Panel title="Eligible counterpart suggestions" subtitle="Includes recall count context and projected post-swap headcounts.">
        {candidates.length === 0 ? (
          <EmptyState title="No candidates" detail="Choose participant and date criteria." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-2 py-2">Candidate</th>
                  <th className="px-2 py-2">Assignment(s)</th>
                  <th className="px-2 py-2" title="Completed swap exchanges">Swaps</th>
                  <th className="px-2 py-2" title="Completed recalled shifts">Recalls</th>
                  <th className="px-2 py-2">Last swap</th>
                  <th className="px-2 py-2">Post-swap headcount</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100">
                    <td className="px-2 py-2">
                      <div className="font-mono">{c.id}</div>
                      <div className="text-xs text-slate-500">{c.team}</div>
                      {c.reason && <div className="mt-1"><StatusChip label={c.reason} tone="danger" /></div>}
                    </td>
                    <td className="px-2 py-2">{c.assignmentAtA} (A date) • {c.assignmentAtB} (B date)</td>
                    <td className="px-2 py-2">{c.completedSwaps}</td>
                    <td className="px-2 py-2">{c.completedRecalls}</td>
                    <td className="px-2 py-2">{agoLabel(c.lastSwap)}</td>
                    <td className="px-2 py-2 text-xs text-slate-600">A: {c.projectedA}<br />B: {c.projectedB}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Swap Requests" subtitle="Approval blocked automatically if any affected shift drops below minimum staffing.">
        {state.swaps.length === 0 ? (
          <EmptyState title="No swap requests" detail="Create a request to start cross-team reassignment." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-2 py-2">Pair</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Dates</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.swaps.map((swap) => (
                  <tr key={swap.id} className="border-b border-slate-100">
                    <td className="px-2 py-2 font-mono">{swap.participantA} ↔ {swap.participantB}</td>
                    <td className="px-2 py-2">{swap.type === 'SAME_DATE' ? 'Same-date' : 'Date-for-date'}</td>
                    <td className="px-2 py-2">{swap.dateA}{swap.dateA !== swap.dateB ? ` / ${swap.dateB}` : ''}</td>
                    <td className="px-2 py-2"><StatusChip label={swap.status} tone={swap.status === 'Approved' ? 'ok' : swap.status === 'Cancelled' || swap.status === 'Declined' ? 'danger' : 'warn'} /></td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-1">
                        {(swap.status === 'Draft' || swap.status === 'Awaiting consent') && (
                          <button
                            className="rounded-lg bg-teal px-2 py-1 text-xs font-semibold text-white"
                            onClick={() => {
                              const issues = swapCoverageIssues(state, swap);
                              if (issues.length > 0) {
                                setError('Approval blocked: this swap causes sub-minimum staffing. Start recall and complete coverage first.');
                                return;
                              }
                              dispatch({ type: 'set-swap-status', id: swap.id, status: 'Approved' });
                              dispatch({ type: 'log', payload: { event: 'Swap approved', after: `${swap.participantA} ↔ ${swap.participantB}` } });
                              setError(null);
                            }}
                          >
                            Approve
                          </button>
                        )}
                        {swap.status !== 'Cancelled' && swap.status !== 'Approved' && (
                          <button
                            className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                            onClick={() => {
                              dispatch({ type: 'set-swap-status', id: swap.id, status: 'Cancelled' });
                              dispatch({ type: 'log', payload: { event: 'Swap cancelled', after: swap.id } });
                            }}
                          >
                            Cancel
                          </button>
                        )}
                        {(swap.status === 'Awaiting consent' || swap.status === 'Draft') && (
                          <button
                            className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                            onClick={() => {
                              dispatch({ type: 'set-swap-status', id: swap.id, status: 'Declined' });
                              dispatch({ type: 'log', payload: { event: 'Swap declined', after: swap.id } });
                            }}
                          >
                            Decline
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {error && <p className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
      </Panel>
    </div>
  );
}
