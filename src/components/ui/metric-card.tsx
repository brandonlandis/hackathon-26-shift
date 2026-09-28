import StatusChip from './status-chip';

type MetricCardProps = {
  title: string;
  value: string;
  hint?: string;
  tone?: 'neutral' | 'ok' | 'warn' | 'danger';
};

export default function MetricCard({ title, value, hint, tone = 'neutral' }: MetricCardProps) {
  const statusTone = tone === 'ok' ? 'ok' : tone === 'warn' ? 'warn' : tone === 'danger' ? 'danger' : 'neutral';

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-panel">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight text-ink">{value}</p>
      {hint && (
        <div className="mt-2">
          <StatusChip label={hint} tone={statusTone} />
        </div>
      )}
    </article>
  );
}
