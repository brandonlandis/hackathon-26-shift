import { useState } from 'react';
import Panel from '../components/ui/panel';
import { useAppStore } from '../store';

export default function SettingsPage() {
  const { state, dispatch } = useAppStore();
  const [form, setForm] = useState(state.settings);

  const save = () => {
    dispatch({ type: 'set-settings', payload: form });
    dispatch({
      type: 'log',
      payload: {
        event: 'Settings updated',
        before: JSON.stringify(state.settings),
        after: JSON.stringify(form),
      },
    });
  };

  return (
    <div className="space-y-4 animate-rise">
      <Panel title="Cycle and Shift Configuration" subtitle="Changing cycle Day 1 recalculates all base team assignments.">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Cycle Day 1 date
            <input
              type="date"
              value={form.cycleDay1Date ?? ''}
              onChange={(e) => setForm({ ...form, cycleDay1Date: e.target.value || null })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="text-sm">
            Minimum staffing per shift
            <input
              type="number"
              min={1}
              value={form.minimumStaffing}
              onChange={(e) => setForm({ ...form, minimumStaffing: Number(e.target.value) })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="text-sm">
            Morning start
            <input
              type="time"
              value={form.morningStart}
              onChange={(e) => setForm({ ...form, morningStart: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="text-sm">
            Morning end
            <input
              type="time"
              value={form.morningEnd}
              onChange={(e) => setForm({ ...form, morningEnd: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="text-sm">
            Afternoon start
            <input
              type="time"
              value={form.afternoonStart}
              onChange={(e) => setForm({ ...form, afternoonStart: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="text-sm">
            Afternoon end
            <input
              type="time"
              value={form.afternoonEnd}
              onChange={(e) => setForm({ ...form, afternoonEnd: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </div>
      </Panel>

      <Panel title="Optional Constraints" subtitle="Configurable and off by default.">
        <div className="grid gap-3 md:grid-cols-3 text-sm">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-3">
            <input type="checkbox" checked={form.enforceShiftEligibility} onChange={(e) => setForm({ ...form, enforceShiftEligibility: e.target.checked })} />
            Enforce shift eligibility
          </label>

          <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-3">
            <input type="checkbox" checked={form.enforceMinRest} onChange={(e) => setForm({ ...form, enforceMinRest: e.target.checked })} />
            Enforce minimum rest
          </label>

          <label className="rounded-lg border border-slate-200 p-3">
            Min rest hours
            <input
              type="number"
              value={form.minRestHours ?? ''}
              onChange={(e) => setForm({ ...form, minRestHours: e.target.value ? Number(e.target.value) : null })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </div>
      </Panel>

      <button onClick={save} className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white">Save settings</button>
    </div>
  );
}
