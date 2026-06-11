"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { formatCOP, formatDate } from "@/lib/format";

interface ImportSummary {
  name: string;
  totalBudget: number;
  durationDays: number;
  startDate: string;
  channels: number;
  days: number;
}

type Status = "idle" | "uploading" | "success" | "error";

export function ImportForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  async function upload(file: File) {
    setStatus("uploading");
    setMessage("");
    setSummary(null);
    setFileName(file.name);

    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/import", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(json.error ?? "No se pudo importar el archivo.");
        return;
      }
      setStatus("success");
      setSummary(json.summary as ImportSummary);
      router.refresh(); // refresca los datos del dashboard
    } catch {
      setStatus("error");
      setMessage("Error de red. Inténtalo de nuevo.");
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }

  return (
    <div className="space-y-5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition ${
          dragging
            ? "border-brand-500 bg-brand-50"
            : "border-slate-300 bg-slate-50/60 hover:border-brand-400 hover:bg-brand-50/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={onPick}
        />
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M12 3v12M7 8l5-5 5 5" />
          </svg>
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-900">
          {status === "uploading"
            ? "Procesando archivo…"
            : "Arrastra tu archivo .xlsx aquí"}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          o haz clic para seleccionarlo · máximo 5 MB
        </p>
        {fileName && status !== "idle" && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
            📄 {fileName}
          </p>
        )}
      </div>

      {status === "uploading" && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-brand-500" />
        </div>
      )}

      {status === "error" && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span className="font-semibold">No se pudo importar. </span>
          {message}
        </div>
      )}

      {status === "success" && summary && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <span>✓</span> Importación completada
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <Item label="Campaña" value={summary.name} />
            <Item label="Presupuesto" value={formatCOP(summary.totalBudget)} />
            <Item label="Duración" value={`${summary.durationDays} días`} />
            <Item label="Inicio" value={formatDate(summary.startDate)} />
            <Item label="Canales" value={String(summary.channels)} />
            <Item label="Días cargados" value={String(summary.days)} />
          </dl>
          <a
            href="/"
            className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Ver dashboard
          </a>
        </div>
      )}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-emerald-600/80">{label}</dt>
      <dd className="font-medium text-emerald-900">{value}</dd>
    </div>
  );
}
