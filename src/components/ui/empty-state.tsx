export default function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
      <p className="font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </div>
  );
}
