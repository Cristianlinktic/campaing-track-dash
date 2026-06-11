import { logoutAction } from "@/app/(app)/actions";

export function TopBar({
  title,
  username,
}: {
  title: string;
  username: string;
}) {
  const initial = (username?.[0] ?? "U").toUpperCase();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-5 backdrop-blur sm:px-8">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2.5 sm:flex">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
            {initial}
          </span>
          <span className="text-sm font-medium text-slate-700">{username}</span>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            Salir
          </button>
        </form>
      </div>
    </header>
  );
}
