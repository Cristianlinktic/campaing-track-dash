# Dashboard de Pauta Digital

Panel de planificación y seguimiento de inversión publicitaria por canal
(Meta · Pilas · Youtube · Google Display), construido con **Next.js 15**,
**Supabase**, **Tailwind CSS v4** y **Recharts**.

Replica y supera la hoja de cálculo "Plan de inversión para pauta": a partir de
los parámetros base (presupuesto, % / CPM / CTR / frecuencia por canal y factores
de peso diarios) calcula automáticamente impresiones, clicks, CPC, alcance y la
distribución diaria — con seguimiento de la ejecución real vs. la meta.

## Características

- **Resumen ejecutivo** con KPIs, distribución por canal y curva de inversión diaria.
- **Distribución por canal**: tabla completa, gráficos y objetivos/KPI por canal.
- **Desglose diario**: inversión día a día según el factor de peso.
- **Proyecciones**: impresiones, clicks y alcance consolidados y diarios.
- **Carga masiva**: importa el plan desde un archivo `.xlsx` (drag & drop).
- **Configuración**: edita parámetros y la app recalcula todo en vivo.
- **Seguimiento real vs meta**: registra la inversión ejecutada por canal.
- **Login** propio con tabla `app_user_campaing` (contraseñas bcrypt + sesión JWT en cookie httpOnly).

## Arquitectura

```
src/
├── app/
│   ├── login/                 # Pantalla de ingreso (server action)
│   ├── (app)/                 # Dashboard protegido
│   │   ├── page.tsx           #   Resumen ejecutivo
│   │   ├── canales/           #   Distribución por canal
│   │   ├── diario/            #   Desglose diario
│   │   ├── proyecciones/      #   Proyecciones
│   │   ├── importar/          #   Carga masiva de Excel
│   │   ├── configuracion/     #   Edición de parámetros
│   │   └── actions.ts         #   Server actions (logout, updates)
│   └── api/import/route.ts    # Endpoint de importación (.xlsx)
├── components/                # UI, gráficos (Recharts) y tablas
├── lib/
│   ├── calc.ts                # Motor de cálculo (fórmulas del Excel)
│   ├── data.ts                # Acceso a datos (Supabase)
│   ├── excel.ts               # Parser del template .xlsx (ExcelJS)
│   ├── auth.ts / session.ts   # Login + JWT
│   ├── supabase/server.ts     # Cliente admin (service role)
│   └── format.ts / constants.ts / types.ts
├── middleware.ts              # Protección de rutas
└── supabase/migrations/       # Esquema SQL + seed (tablas, RLS)
```

El acceso a la base de datos es **siempre del lado servidor** usando la *service
role key*. Las tablas tienen **RLS habilitado** y sin políticas para `anon`, por
lo que la clave pública no puede leer ni escribir (defensa en profundidad).

## Puesta en marcha

### 1. Variables de entorno

```bash
cp .env.local.example .env.local
```

Rellena en `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` → Supabase → Project Settings → API.
- `AUTH_SECRET` → genera uno: `openssl rand -base64 48`.

### 2. Base de datos (Supabase)

En **Supabase → SQL Editor**, ejecuta en orden:

1. `supabase/migrations/0001_schema.sql` — tablas, índices y RLS.
2. `supabase/migrations/0002_seed.sql` — usuario inicial + datos del plan.

Usuario por defecto: **`admin` / `admin123`** (cámbialo tras ingresar).

### 3. Desarrollo

```bash
npm install
npm run dev
```

Abre <http://localhost:3000>.

### 4. Importar tu Excel

Inicia sesión → **Importar Excel** → arrastra `pauta.xlsx`. El plan reemplaza la
campaña actual; la inversión real registrada se conserva.

## Despliegue en Vercel

1. Sube el repo a GitHub e impórtalo en Vercel.
2. En **Settings → Environment Variables** añade las tres variables del `.env.local`.
3. Deploy. El parser de Excel y bcrypt corren en el runtime Node (ya configurado).

## Gestión de usuarios

Para crear/cambiar una contraseña, genera el hash y úsalo en SQL:

```bash
npm run hash "miClaveSegura"
# → $2a$10$....  (pégalo en la tabla app_user_campaing.password_hash)
```
