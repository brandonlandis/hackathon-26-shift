import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { createDemoState } from './demo-data';
import type { AppState, Employee, RecallStatus, Settings, SwapRequest, SwapStatus, Unavailability } from './types';

const STORAGE_KEY = 'shiftfair-demo-v2';

type Action =
  | { type: 'hydrate'; payload: AppState }
  | { type: 'reset' }
  | { type: 'set-settings'; payload: Settings }
  | { type: 'import-roster'; payload: Employee[] }
  | { type: 'add-unavailability'; payload: Unavailability }
  | { type: 'create-swap'; payload: SwapRequest }
  | { type: 'set-swap-status'; id: string; status: SwapStatus }
  | { type: 'create-recall'; payload: { id: string; date: string; shift: 'MORNING' | 'AFTERNOON' | 'REST'; candidateId: string; status: RecallStatus; note?: string } }
  | { type: 'set-recall-status'; id: string; status: RecallStatus }
  | { type: 'log'; payload: { event: string; before?: string; after?: string } };

const now = () => new Date().toISOString();

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'hydrate':
      return action.payload;
    case 'reset':
      return createDemoState();
    case 'set-settings':
      return { ...state, settings: action.payload };
    case 'import-roster':
      return { ...state, employees: action.payload };
    case 'add-unavailability':
      return { ...state, unavailability: [action.payload, ...state.unavailability] };
    case 'create-swap':
      return { ...state, swaps: [action.payload, ...state.swaps] };
    case 'set-swap-status':
      return {
        ...state,
        swaps: state.swaps.map((swap) => (swap.id === action.id ? { ...swap, status: action.status, updatedAt: now() } : swap)),
      };
    case 'create-recall': {
      const ts = now();
      return {
        ...state,
        recalls: [{ ...action.payload, createdAt: ts, updatedAt: ts }, ...state.recalls],
      };
    }
    case 'set-recall-status':
      return {
        ...state,
        recalls: state.recalls.map((recall) => (recall.id === action.id ? { ...recall, status: action.status, updatedAt: now() } : recall)),
      };
    case 'log':
      return {
        ...state,
        activity: [
          {
            id: crypto.randomUUID(),
            timestamp: now(),
            actor: 'Manager',
            event: action.payload.event,
            before: action.payload.before,
            after: action.payload.after,
          },
          ...state.activity,
        ],
      };
    default:
      return state;
  }
};

type StoreContextValue = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  isHydrating: boolean;
  hydrateError: string | null;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export const AppStoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, createDemoState());
  const [isHydrating, setHydrating] = useState(true);
  const [hydrateError, setHydrateError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        dispatch({ type: 'hydrate', payload: parsed });
      }
    } catch {
      setHydrateError('Could not read saved local demo data. Demo defaults loaded.');
    } finally {
      setTimeout(() => setHydrating(false), 180);
    }
  }, []);

  useEffect(() => {
    if (isHydrating) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [isHydrating, state]);

  const value = useMemo(() => ({ state, dispatch, isHydrating, hydrateError }), [state, isHydrating, hydrateError]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useAppStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider');
  return ctx;
};
