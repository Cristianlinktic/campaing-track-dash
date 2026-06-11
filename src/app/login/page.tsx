import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Ingresar · Dashboard de Pauta",
};

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Panel de marca */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-900 lg:block">
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_30%_20%,white,transparent_45%),radial-gradient(circle_at_80%_70%,white,transparent_40%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-lg font-bold backdrop-blur">
              ◎
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Dashboard de Pauta
            </span>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight">
              Planifica y monitorea
              <br />
              tu inversión digital.
            </h1>
            <p className="max-w-md text-brand-100">
              Distribución por canal, desglose diario, proyecciones de
              impresiones y clicks, y seguimiento de la ejecución real — en un
              solo lugar.
            </p>
          </div>
          <p className="text-sm text-brand-200">
            Instagram · Facebook · Youtube · Google Display
          </p>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">
              Bienvenido de nuevo
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Ingresa tus credenciales para acceder al panel.
            </p>
          </div>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
