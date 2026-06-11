import type { ReactNode } from "react";

export function KpiCard({
  label,
  value,
  hint,
  icon,
  accent = "brand",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  accent?: "brand" | "emerald" | "amber" | "violet" | "rose" | "slate";
}) {
  const accents: Record<string, string> = {
    brand: "bg-brand-50 text-brand-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    rose: "bg-rose-50 text-rose-600",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        {icon && (
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${accents[accent]}`}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
