import type { AppState, Employee, TeamId } from './types';

const makeTeam = (team: TeamId): Employee[] =>
  Array.from({ length: 15 }).map((_, i) => ({
    id: `${team}-${String(i + 1).padStart(2, '0')}`,
    homeTeam: team,
  }));

const now = new Date().toISOString();

export const createDemoState = (): AppState => ({
  employees: [...makeTeam('T1'), ...makeTeam('T2'), ...makeTeam('T3')],
  settings: {
    cycleDay1Date: null,
    demoFallbackCycleDay1: '2026-09-01',
    morningStart: '07:45',
    morningEnd: '14:35',
    afternoonStart: '14:35',
    afternoonEnd: '21:35',
    minimumStaffing: 10,
    enforceShiftEligibility: false,
    enforceMinRest: false,
    minRestHours: null,
  },
  unavailability: [
    {
      id: 'u-1',
      employeeId: 'T1-03',
      startDate: '2026-09-29',
      endDate: '2026-10-01',
      status: 'Leave',
      note: 'Planned leave',
      approved: true,
      createdAt: now,
    },
    {
      id: 'u-2',
      employeeId: 'T2-09',
      startDate: '2026-09-29',
      endDate: '2026-09-29',
      status: 'Unavailable',
      note: 'Unavailable',
      approved: true,
      createdAt: now,
    },
  ],
  swaps: [
    {
      id: 's-1',
      type: 'SAME_DATE',
      status: 'Awaiting consent',
      participantA: 'T1-01',
      participantB: 'T2-01',
      dateA: '2026-09-30',
      dateB: '2026-09-30',
      fromA: 'AFTERNOON',
      fromB: 'MORNING',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 's-2',
      type: 'DATE_FOR_DATE',
      status: 'Approved',
      participantA: 'T3-05',
      participantB: 'T1-08',
      dateA: '2026-10-02',
      dateB: '2026-10-04',
      fromA: 'MORNING',
      fromB: 'AFTERNOON',
      createdAt: now,
      updatedAt: now,
    },
  ],
  recalls: [
    {
      id: 'r-1',
      date: '2026-09-29',
      shift: 'MORNING',
      candidateId: 'T3-02',
      status: 'Offered',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'r-2',
      date: '2026-09-28',
      shift: 'AFTERNOON',
      candidateId: 'T3-04',
      status: 'Completed',
      createdAt: now,
      updatedAt: now,
    },
  ],
  activity: [
    {
      id: 'a-1',
      timestamp: now,
      actor: 'Manager',
      event: 'Demo initialized with 45 placeholder IDs and sample scheduling events',
    },
  ],
});
