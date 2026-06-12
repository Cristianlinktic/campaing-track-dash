"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// ── Tipos ─────────────────────────────────────────────────────────────────

export type ToastType = "success" | "error";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  show: (type: ToastType, message: string) => void;
}

// ── Contexto ──────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ── Provider + Renderer ───────────────────────────────────────────────────

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((type: ToastType, message: string) => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => remove(id), AUTO_DISMISS_MS);
  }, [remove]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}

      {/* Portal de toasts — esquina inferior derecha */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ── Item individual ────────────────────────────────────────────────────────

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  // Entrada con pequeño delay para que la transición CSS se dispare.
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const isSuccess = toast.type === "success";

  return (
    <div
      className={`pointer-events-auto flex w-80 max-w-[calc(100vw-2.5rem)] items-start gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      } ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-rose-200 bg-rose-50 text-rose-900"
      }`}
    >
      {/* Icono */}
      <span className="mt-0.5 shrink-0 text-base">
        {isSuccess ? "✓" : "✕"}
      </span>

      {/* Mensaje */}
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>

      {/* Cerrar */}
      <button
        onClick={onClose}
        className={`shrink-0 rounded p-0.5 transition hover:opacity-70 ${
          isSuccess ? "text-emerald-600" : "text-rose-600"
        }`}
        aria-label="Cerrar"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
