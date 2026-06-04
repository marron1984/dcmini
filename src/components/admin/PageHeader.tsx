export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-ink">
          <span className="h-6 w-1.5 rounded-full bg-gradient-to-b from-brand-500 to-accent-500" />
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 pl-4 text-sm text-ink-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
