type PageTitleProps = {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
};

export default function PageTitle({ title, subtitle, actions }: PageTitleProps) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      </div>
      {actions}
    </header>
  );
}
