import type { ReactNode } from 'react';

type PanelProps = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function Panel({ title, subtitle, actions, children, className = '' }: PanelProps) {
  return (
    <section className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-panel md:p-5 ${className}`}>
      {(title || subtitle || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-base font-semibold text-ink">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
