"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const ICONS = {
  resumen: (
    <path d="M3 12h4l3 8 4-16 3 8h4" />
  ),
  canales: (
    <>
      <path d="M3 3v18h18" />
      <rect x="7" y="10" width="3" height="7" />
      <rect x="12" y="6" width="3" height="11" />
      <rect x="17" y="13" width="3" height="4" />
    </>
  ),
  diario: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </>
  ),
  proyecciones: (
    <>
      <path d="M3 17l6-6 4 4 7-7" />
      <path d="M21 8v4h-4" />
    </>
  ),
  importar: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M12 3v12M7 8l5-5 5 5" />
    </>
  ),
  config: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
};

const NAV: NavItem[] = [
  { href: "/", label: "Resumen", icon: ICONS.resumen },
  { href: "/canales", label: "Distribución x Canal", icon: ICONS.canales },
  { href: "/diario", label: "Desglose Diario", icon: ICONS.diario },
  { href: "/proyecciones", label: "Proyecciones", icon: ICONS.proyecciones },
  { href: "/importar", label: "Importar Excel", icon: ICONS.importar, adminOnly: true },
  { href: "/configuracion", label: "Configuración", icon: ICONS.config, adminOnly: true },
];

export function Sidebar({ role = "reader" }: { role?: "admin" | "reader" }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
          ◎
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-900">Pauta Digital</p>
          <p className="text-[11px] text-slate-400">Panel de control</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.filter((item) => !item.adminOnly || role === "admin").map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                {item.icon}
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 px-5 py-4">
        <p className="text-[11px] leading-relaxed text-slate-400">
          Campaña de 15 días · Meta · Pilas · Youtube · Google Display
        </p>
      </div>
    </aside>
  );
}
