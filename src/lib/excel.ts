import "server-only";
import ExcelJS from "exceljs";
import type { ChannelKey, ParsedChannel, ParsedDay, ParsedPlan } from "./types";

// ════════════════════════════════════════════════════════════════════════
//  PARSER DEL TEMPLATE DE PAUTA  (carga masiva)
//  Lee el .xlsx con la estructura de "Plan de inversión para pauta":
//    Hoja 0  Resumen Ejecutivo  → presupuesto, duración, %/CPM/CTR por canal
//    Hoja 1  Distribución x Canal → objetivo, público, KPI por canal
//    Hoja 2  Desglose Diario     → fecha inicio + factores de peso por día
//    Hoja 3  Proyecciones        → frecuencia por canal
// ════════════════════════════════════════════════════════════════════════

const CHANNEL_BY_INDEX: ChannelKey[] = [
  "meta",
  "pilas",
  "youtube",
  "google_display",
];

export class ExcelParseError extends Error {}

// ── Coerción de valores de celda ──────────────────────────────────────────

function cellNumber(ws: ExcelJS.Worksheet, address: string): number | null {
  const v = ws.getCell(address).value;
  return toNumber(v);
}

function toNumber(v: ExcelJS.CellValue): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  if (typeof v === "object" && "result" in v) return toNumber((v as { result: ExcelJS.CellValue }).result);
  return null;
}

function cellText(ws: ExcelJS.Worksheet, address: string): string | null {
  const v = ws.getCell(address).value;
  return toText(v);
}

function toText(v: ExcelJS.CellValue): string | null {
  if (v == null) return null;
  if (typeof v === "string") return cleanText(v);
  if (typeof v === "number") return String(v);
  if (typeof v === "object") {
    if ("richText" in v) {
      return cleanText(
        (v as { richText: { text: string }[] }).richText.map((r) => r.text).join(""),
      );
    }
    if ("result" in v) return toText((v as { result: ExcelJS.CellValue }).result);
    if ("text" in v) return cleanText(String((v as { text: unknown }).text));
  }
  return null;
}

function cleanText(s: string): string | null {
  const out = s.replace(/\s*\n\s*/g, " ").trim();
  return out.length ? out : null;
}

function toISODate(v: ExcelJS.CellValue): string | null {
  if (v instanceof Date) {
    const y = v.getUTCFullYear();
    const m = String(v.getUTCMonth() + 1).padStart(2, "0");
    const d = String(v.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return null;
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// ── Localización tolerante de hojas ───────────────────────────────────────

function pickSheet(
  wb: ExcelJS.Workbook,
  index: number,
  keyword: string,
): ExcelJS.Worksheet {
  // Preferimos por nombre (los emojis del template lo hacen frágil por índice),
  // con respaldo por posición.
  const byName = wb.worksheets.find((w) =>
    w.name.toLowerCase().includes(keyword.toLowerCase()),
  );
  const sheet = byName ?? wb.worksheets[index];
  if (!sheet) {
    throw new ExcelParseError(
      `No se encontró la hoja "${keyword}" (posición ${index + 1}). ¿El archivo tiene el formato esperado?`,
    );
  }
  return sheet;
}

// ── Parser principal ──────────────────────────────────────────────────────

export async function parsePautaWorkbook(
  buffer: ArrayBuffer | Buffer,
): Promise<ParsedPlan> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buffer as ArrayBuffer);
  } catch {
    throw new ExcelParseError("No se pudo leer el archivo. ¿Es un .xlsx válido?");
  }

  if (wb.worksheets.length < 3) {
    throw new ExcelParseError(
      "El archivo no tiene las hojas esperadas (Resumen, Distribución, Desglose Diario, Proyecciones).",
    );
  }

  const resumen = pickSheet(wb, 0, "resumen");
  const distrib = pickSheet(wb, 1, "distribuci");
  const diario = pickSheet(wb, 2, "diario");
  const proyec = pickSheet(wb, 3, "proyec");

  // ── Parámetros globales (hoja Resumen, columna E) ──
  const totalBudget = cellNumber(resumen, "E6");
  if (totalBudget == null || totalBudget <= 0) {
    throw new ExcelParseError(
      "No se encontró un presupuesto total válido en la hoja Resumen (celda E6).",
    );
  }
  const durationFromCell = cellNumber(resumen, "E7");

  // Filas de canales en cada hoja:
  //   Resumen:      8..11 (%)  12..15 (CPM)  16..19 (CTR)
  //   Distribución: 15..18 (objetivo/público/KPI)
  //   Proyecciones:  7..10 (frecuencia)
  const channels: ParsedChannel[] = CHANNEL_BY_INDEX.map((channel, i) => ({
    channel,
    participation_pct: cellNumber(resumen, `E${8 + i}`) ?? 0,
    cpm: cellNumber(resumen, `E${12 + i}`) ?? 0,
    ctr: cellNumber(resumen, `E${16 + i}`) ?? 0,
    frequency: cellNumber(proyec, `I${7 + i}`) ?? 1.4,
    objective: cellText(distrib, `C${15 + i}`),
    target_audience: cellText(distrib, `E${15 + i}`),
    main_kpi: cellText(distrib, `K${15 + i}`),
  }));

  // ── Desglose diario: fecha inicio + factores ──
  const startDate = toISODate(diario.getCell("C6").value);
  if (!startDate) {
    throw new ExcelParseError(
      "No se encontró la fecha de inicio en la hoja Desglose Diario (celda C6).",
    );
  }

  const days: ParsedDay[] = [];
  for (let row = 6; row <= 60; row++) {
    const dayNum = cellNumber(diario, `B${row}`);
    const factor = cellNumber(diario, `D${row}`);
    if (dayNum == null) break; // fila TOTAL o vacía → fin
    days.push({
      day_number: Math.round(dayNum),
      date: addDays(startDate, days.length),
      weight_factor: factor ?? 1,
    });
  }

  if (days.length === 0) {
    throw new ExcelParseError("No se encontraron días en la hoja Desglose Diario.");
  }

  const name =
    cellText(resumen, "B2") && !/resumen ejecutivo/i.test(cellText(resumen, "B2")!)
      ? cellText(resumen, "B2")!
      : "Plan de inversión para pauta";

  return {
    name,
    total_budget: totalBudget,
    duration_days: durationFromCell ? Math.round(durationFromCell) : days.length,
    start_date: startDate,
    channels,
    days,
  };
}
