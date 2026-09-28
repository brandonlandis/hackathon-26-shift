export type TeamId = 'T1' | 'T2' | 'T3';
export type ShiftType = 'MORNING' | 'AFTERNOON' | 'REST';
export type SwapType = 'SAME_DATE' | 'DATE_FOR_DATE';
export type SwapStatus = 'Draft' | 'Awaiting consent' | 'Approved' | 'Declined' | 'Cancelled';
export type RecallStatus = 'Offered' | 'Accepted' | 'Declined' | 'Completed' | 'Unfilled';

export interface Employee {
  id: string;
  homeTeam: TeamId;
}

export interface Settings {
  cycleDay1Date: string | null;
  demoFallbackCycleDay1: string;
  morningStart: string;
  morningEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
  minimumStaffing: number;
  enforceShiftEligibility: boolean;
  enforceMinRest: boolean;
  minRestHours: number | null;
}

export interface Unavailability {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  status: 'Leave' | 'Unavailable';
  note?: string;
  approved: boolean;
  createdAt: string;
}

export interface SwapRequest {
  id: string;
  type: SwapType;
  status: SwapStatus;
  participantA: string;
  participantB: string;
  dateA: string;
  dateB: string;
  fromA: ShiftType;
  fromB: ShiftType;
  createdAt: string;
  updatedAt: string;
}

export interface RecallOffer {
  id: string;
  date: string;
  shift: ShiftType;
  candidateId: string;
  status: RecallStatus;
  createdAt: string;
  updatedAt: string;
  note?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  actor: string;
  event: string;
  before?: string;
  after?: string;
}

export interface AppState {
  employees: Employee[];
  settings: Settings;
  unavailability: Unavailability[];
  swaps: SwapRequest[];
  recalls: RecallOffer[];
  activity: ActivityLog[];
}

export interface AssignmentInfo {
  shift: ShiftType;
  label: 'Morning' | 'Afternoon' | 'Rest' | 'Approved swap' | 'Leave/unavailable' | 'Recalled' | 'Pending';
}
