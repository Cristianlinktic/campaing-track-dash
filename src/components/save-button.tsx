"use client";

import { useFormStatus } from "react-dom";

export function SaveButton({
  children = "Guardar",
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {pending ? "Guardando…" : children}
    </button>
  );
}
