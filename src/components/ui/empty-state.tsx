import Link from "next/link";

export function EmptyState({
  title = "Aún no hay datos de campaña",
  description = "Importa tu archivo de pauta (.xlsx) para poblar el dashboard, o ejecuta el seed en Supabase.",
  ctaHref = "/importar",
  ctaLabel = "Importar Excel",
}: {
  title?: string;
  description?: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-3xl text-brand-500">
        ◎
      </div>
      <h2 className="mt-5 text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
      <Link
        href={ctaHref}
        className="mt-6 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
