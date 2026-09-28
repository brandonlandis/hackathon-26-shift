import EmptyState from '../components/ui/empty-state';
import Panel from '../components/ui/panel';
import { fmtDateTime } from '../lib/format';
import { useAppStore } from '../store';

export default function ActivityPage() {
  const { state } = useAppStore();

  return (
    <div className="animate-rise">
      <Panel title="Activity and Audit Trail" subtitle="Chronological record of edits, approvals, recalls, and manager actions including before/after when available.">
        {state.activity.length === 0 ? (
          <EmptyState title="No activity entries" detail="Actions will appear here as scheduling changes are made." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-2 py-2">Timestamp</th>
                  <th className="px-2 py-2">Actor</th>
                  <th className="px-2 py-2">Event</th>
                  <th className="px-2 py-2">Before</th>
                  <th className="px-2 py-2">After</th>
                </tr>
              </thead>
              <tbody>
                {state.activity.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-100 align-top">
                    <td className="px-2 py-2 whitespace-nowrap">{fmtDateTime(entry.timestamp)}</td>
                    <td className="px-2 py-2">{entry.actor}</td>
                    <td className="px-2 py-2">{entry.event}</td>
                    <td className="px-2 py-2 text-xs text-slate-500">{entry.before ?? '-'}</td>
                    <td className="px-2 py-2 text-xs text-slate-500">{entry.after ?? '-'}</td>
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
