type StatusTone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info';

const toneMap: Record<StatusTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  ok: 'bg-teal/10 text-teal border-teal/30',
  warn: 'bg-amber/10 text-amber border-amber/30',
  danger: 'bg-danger/10 text-danger border-danger/30',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default function StatusChip({ label, tone = 'neutral' }: { label: string; tone?: StatusTone }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneMap[tone]}`}>{label}</span>;
}
