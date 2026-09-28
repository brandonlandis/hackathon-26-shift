import type { AppState, AssignmentInfo, Employee, ShiftType, SwapRequest, TeamId } from '../types';

const CYCLE: Record<TeamId, ShiftType[]> = {
  T1: ['AFTERNOON', 'AFTERNOON', 'MORNING', 'MORNING', 'REST', 'REST'],
  T2: ['MORNING', 'MORNING', 'REST', 'REST', 'AFTERNOON', 'AFTERNOON'],
  T3: ['REST', 'REST', 'AFTERNOON', 'AFTERNOON', 'MORNING', 'MORNING'],
};

export const toIsoDate = (d: Date): string => d.toISOString().slice(0, 10);

export const todayIso = (): string => toIsoDate(new Date());

export const addDays = (date: string, days: number): string => {
  const base = new Date(`${date}T00:00:00`);
  base.setDate(base.getDate() + days);
  return toIsoDate(base);
};

const dayDiff = (left: string, right: string): number => {
  const a = new Date(`${left}T00:00:00`).getTime();
  const b = new Date(`${right}T00:00:00`).getTime();
  return Math.floor((a - b) / 86400000);
};

export const anchorDate = (state: AppState): string => state.settings.cycleDay1Date ?? state.settings.demoFallbackCycleDay1;

export const cycleDay = (date: string, anchor: string): number => {
  const mod = ((dayDiff(date, anchor) % 6) + 6) % 6;
  return mod + 1;
};

export const baseShift = (team: TeamId, date: string, anchor: string): ShiftType => CYCLE[team][cycleDay(date, anchor) - 1];

const dateInRange = (target: string, start: string, end: string) => target >= start && target <= end;

const getUnavailable = (state: AppState, employeeId: string, date: string) =>
  state.unavailability.find((item) => item.approved && item.employeeId === employeeId && dateInRange(date, item.startDate, item.endDate));

const approvedSwapShift = (state: AppState, employeeId: string, date: string): ShiftType | null => {
  for (const swap of state.swaps) {
    if (swap.status !== 'Approved') continue;
    if (swap.participantA === employeeId && swap.dateA === date) return swap.fromB;
    if (swap.participantB === employeeId && swap.dateB === date) return swap.fromA;
  }
  return null;
};

const completedRecallShift = (state: AppState, employeeId: string, date: string): ShiftType | null => {
  const recall = state.recalls.find((r) => r.status === 'Completed' && r.candidateId === employeeId && r.date === date);
  return recall?.shift ?? null;
};

const isPendingSwapDate = (state: AppState, employeeId: string, date: string): boolean =>
  state.swaps.some((swap) => {
    const active = swap.status === 'Draft' || swap.status === 'Awaiting consent';
    return active && ((swap.participantA === employeeId && swap.dateA === date) || (swap.participantB === employeeId && swap.dateB === date));
  });

export const effectiveAssignment = (state: AppState, employee: Employee, date: string): AssignmentInfo => {
  const unavailable = getUnavailable(state, employee.id, date);
  if (unavailable) return { shift: 'REST', label: 'Leave/unavailable' };

  const recalled = completedRecallShift(state, employee.id, date);
  if (recalled) return { shift: recalled, label: 'Recalled' };

  const swapped = approvedSwapShift(state, employee.id, date);
  if (swapped) return { shift: swapped, label: 'Approved swap' };

  const base = baseShift(employee.homeTeam, date, anchorDate(state));
  if (isPendingSwapDate(state, employee.id, date)) return { shift: base, label: 'Pending' };
  if (base === 'MORNING') return { shift: base, label: 'Morning' };
  if (base === 'AFTERNOON') return { shift: base, label: 'Afternoon' };
  return { shift: base, label: 'Rest' };
};

export const headcount = (state: AppState, date: string) => {
  let morning = 0;
  let afternoon = 0;

  state.employees.forEach((employee) => {
    const assignment = effectiveAssignment(state, employee, date);
    if (assignment.shift === 'MORNING') morning += 1;
    if (assignment.shift === 'AFTERNOON') afternoon += 1;
  });

  const min = state.settings.minimumStaffing;
  return {
    morning,
    afternoon,
    min,
    morningShort: Math.max(0, min - morning),
    afternoonShort: Math.max(0, min - afternoon),
  };
};

export const restTeamForDate = (state: AppState, date: string): TeamId => {
  const anchor = anchorDate(state);
  const found = (['T1', 'T2', 'T3'] as TeamId[]).find((team) => baseShift(team, date, anchor) === 'REST');
  return found ?? 'T3';
};

export const fairnessForEmployee = (state: AppState, employeeId: string) => {
  const completedSwaps = state.swaps.filter(
    (swap) => swap.status === 'Approved' && (swap.participantA === employeeId || swap.participantB === employeeId),
  );

  const recalls = state.recalls.filter((r) => r.candidateId === employeeId);
  const completedRecalls = recalls.filter((r) => r.status === 'Completed');

  const swapDates = completedSwaps.map((s) => s.updatedAt).sort();
  const recallDates = completedRecalls.map((r) => r.updatedAt).sort();

  return {
    completedSwaps: completedSwaps.length,
    lastSwap: swapDates.length > 0 ? swapDates[swapDates.length - 1] : null,
    completedRecalls: completedRecalls.length,
    recallOffers: recalls.length,
    lastRecall: recallDates.length > 0 ? recallDates[recallDates.length - 1] : null,
  };
};

export const simulateApprovedSwap = (state: AppState, pending: SwapRequest): AppState => {
  const nextSwaps = state.swaps.some((s) => s.id === pending.id)
    ? state.swaps.map((s) => (s.id === pending.id ? { ...s, status: 'Approved' as const } : s))
    : [...state.swaps, { ...pending, status: 'Approved' as const }];

  return { ...state, swaps: nextSwaps };
};

export const swapCoverageIssues = (state: AppState, pending: SwapRequest) => {
  const simulated = simulateApprovedSwap(state, pending);
  const affectedDates = Array.from(new Set([pending.dateA, pending.dateB]));
  return affectedDates
    .map((date) => ({ date, counts: headcount(simulated, date) }))
    .filter((entry) => entry.counts.morningShort > 0 || entry.counts.afternoonShort > 0);
};

export const activeSwapOnDate = (state: AppState, employeeId: string, date: string): boolean =>
  state.swaps.some((swap) => {
    if (swap.status === 'Cancelled' || swap.status === 'Declined') return false;
    return (
      (swap.participantA === employeeId && swap.dateA === date) ||
      (swap.participantB === employeeId && swap.dateB === date)
    );
  });
