import { useMemo, useState } from 'react';
import EmptyState from '../components/ui/empty-state';
import Panel from '../components/ui/panel';
import StatusChip from '../components/ui/status-chip';
import { agoLabel } from '../lib/format';
import { effectiveAssignment, fairnessForEmployee, headcount, restTeamForDate, todayIso } from '../lib/schedule';
import { useAppStore } from '../store';

const sortByFairness = (a: { completedRecalls: number; lastRecall: string | null; recallOffers: number }, b: { completedRecalls: number; lastRecall: string | null; recallOffers: number }) => {
  if (a.completedRecalls !== b.completedRecalls) return a.completedRecalls - b.completedRecalls;
  const ta = a.lastRecall ? new Date(a.lastRecall).getTime() : 0;
  const tb = b.lastRecall ? new Date(b.lastRecall).getTime() : 0;
  if (ta !== tb) return ta - tb;
  return a.recallOffers - b.recallOffers;
};

export default function RecallsPage() {
  const { state, dispatch } = useAppStore();
  const [date, setDate] = useState(todayIso());

  const counts = headcount(state, date);
  const restTeam = restTeamForDate(state, date);

  const usedPoolIds = new Set(
    state.recalls
      .filter((r) => r.date === date && (r.status === 'Offered' || r.status === 'Accepted' || r.status === 'Completed'))
      .map((r) => r.candidateId),
  );

  const candidates = useMemo(() => {
    return state.employees
      .filter((employee) => employee.homeTeam === restTeam)
      .map((employee) => {
        const assignment = effectiveAssignment(state, employee, date);
        const fairness = fairnessForEmployee(state, employee.id);

        let exclusion: string | null = null;
        if (assignment.label === 'Leave/unavailable') exclusion = 'Unavailable';
        else if (assignment.shift !== 'REST') exclusion = 'Already assigned';
        else if (usedPoolIds.has(employee.id)) exclusion = 'Already offered/assigned';

        return {
          id: employee.id,
          assignment: assignment.shift,
          availability: assignment.label,
          exclusion,
          ...fairness,
        };
      })
      .sort(sortByFairness);
  }, [date, restTeam, state, usedPoolIds]);

  const eligibleNow = candidates.filter((c) => !c.exclusion);

  const unfilledMorning = Math.max(0, counts.morningShort - state.recalls.filter((r) => r.date === date && r.shift === 'MORNING' && r.status === 'Completed').length);
  const unfilledAfternoon = Math.max(0, counts.afternoonShort - state.recalls.filter((r) => r.date === date && r.shift === 'AFTERNOON' && r.status === 'Completed').length);

  const poolRemaining = eligibleNow.length;
  const combinedShortage = counts.morningShort + counts.afternoonShort;
  const explicitUnfilled = Math.max(0, combinedShortage - poolRemaining);

  const offerRecall = (candidateId: string, shift: 'MORNING' | 'AFTERNOON') => {
    dispatch({
      type: 'create-recall',
      payload: {
        id: crypto.randomUUID(),
        date,
        shift,
        candidateId,
        status: 'Offered',
      },
    });
    dispatch({ type: 'log', payload: { event: 'Recall offered', after: `${candidateId} • ${shift} • ${date}` } });
  };

  const dayOffers = state.recalls.filter((recall) => recall.date === date);

  return (
    <div className="space-y-4 animate-rise">
      <Panel title="Recall Operations" subtitle="Shared off-shift pool allocation for shortage recovery." actions={<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />}>
        <div className="grid gap-3 md:grid-cols-2">
          <div className={`rounded-xl border p-3 ${counts.morningShort > 0 ? 'border-danger/30 bg-danger/10 text-danger' : 'border-teal/30 bg-teal/10 text-teal'}`}>
            Morning headcount: {counts.morning} / {counts.min} minimum
          </div>
          <div className={`rounded-xl border p-3 ${counts.afternoonShort > 0 ? 'border-danger/30 bg-danger/10 text-danger' : 'border-teal/30 bg-teal/10 text-teal'}`}>
            Afternoon headcount: {counts.afternoon} / {counts.min} minimum
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-600">Rest-team recall pool on this date: <span className="font-semibold">{restTeam}</span></p>
      </Panel>

      {(unfilledMorning > 0 || unfilledAfternoon > 0 || explicitUnfilled > 0) && (
        <Panel>
          <div className="space-y-1 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            <p>Unfilled shortage monitor</p>
            <p>Morning remaining shortfall: {unfilledMorning}</p>
            <p>Afternoon remaining shortfall: {unfilledAfternoon}</p>
            <p>Combined shortfall beyond currently eligible off-shift pool: {explicitUnfilled}</p>
          </div>
        </Panel>
      )}

      <Panel
        title="Ranked Recall Candidates"
        subtitle="Ranking: fewest completed recalls, longest since last completed recall, then fewest total offers."
      >
        {candidates.length === 0 ? (
          <EmptyState title="No pool members" detail="No employees found in rest-team pool for this date." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-2 py-2">Employee</th>
                  <th className="px-2 py-2">Availability</th>
                  <th className="px-2 py-2" title="Completed recalled shifts">Completed recalls</th>
                  <th className="px-2 py-2" title="Total recall offers">Offer count</th>
                  <th className="px-2 py-2">Last recall</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => (
                  <tr key={candidate.id} className="border-b border-slate-100">
                    <td className="px-2 py-2 font-mono">{candidate.id}</td>
                    <td className="px-2 py-2">
                      {candidate.exclusion ? <StatusChip label={candidate.exclusion} tone="danger" /> : <StatusChip label="Eligible" tone="ok" />}
                    </td>
                    <td className="px-2 py-2">{candidate.completedRecalls}</td>
                    <td className="px-2 py-2">{candidate.recallOffers}</td>
                    <td className="px-2 py-2">{agoLabel(candidate.lastRecall)}</td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-1">
                        <button
                          disabled={Boolean(candidate.exclusion) || counts.morningShort === 0}
                          onClick={() => offerRecall(candidate.id, 'MORNING')}
                          className="rounded-lg bg-amber px-2 py-1 text-xs font-semibold text-white disabled:opacity-40"
                        >
                          Offer Morning
                        </button>
                        <button
                          disabled={Boolean(candidate.exclusion) || counts.afternoonShort === 0}
                          onClick={() => offerRecall(candidate.id, 'AFTERNOON')}
                          className="rounded-lg bg-amber px-2 py-1 text-xs font-semibold text-white disabled:opacity-40"
                        >
                          Offer Afternoon
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Recall Offers and Outcomes" subtitle="Offers and declines are tracked separately; only completed recalls increase completed recall counts.">
        {dayOffers.length === 0 ? (
          <EmptyState title="No recall offers" detail="Start with the top ranked candidates if coverage is short." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-2 py-2">Candidate</th>
                  <th className="px-2 py-2">Shift</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Update</th>
                </tr>
              </thead>
              <tbody>
                {dayOffers.map((offer) => (
                  <tr key={offer.id} className="border-b border-slate-100">
                    <td className="px-2 py-2 font-mono">{offer.candidateId}</td>
                    <td className="px-2 py-2">{offer.shift}</td>
                    <td className="px-2 py-2"><StatusChip label={offer.status} tone={offer.status === 'Completed' ? 'ok' : offer.status === 'Declined' || offer.status === 'Unfilled' ? 'danger' : 'warn'} /></td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-1">
                        <button className="rounded-lg border border-slate-300 px-2 py-1 text-xs" onClick={() => dispatch({ type: 'set-recall-status', id: offer.id, status: 'Accepted' })}>Accepted</button>
                        <button className="rounded-lg border border-slate-300 px-2 py-1 text-xs" onClick={() => dispatch({ type: 'set-recall-status', id: offer.id, status: 'Declined' })}>Declined</button>
                        <button className="rounded-lg bg-teal px-2 py-1 text-xs font-semibold text-white" onClick={() => dispatch({ type: 'set-recall-status', id: offer.id, status: 'Completed' })}>Completed</button>
                        <button className="rounded-lg border border-slate-300 px-2 py-1 text-xs" onClick={() => dispatch({ type: 'set-recall-status', id: offer.id, status: 'Unfilled' })}>Unfilled</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
