import type { ChannelKey } from "./types";

export interface ChannelMeta {
  key: ChannelKey;
  label: string;
  subtitle: string;
  /** Color principal (hex) usado en gráficos y badges. */
  color: string;
}

// Metadatos visuales por canal. El orden define el orden por defecto.
export const CHANNELS: Record<ChannelKey, ChannelMeta> = {
  meta: {
    key: "meta",
    label: "Meta",
    subtitle: "Instagram · Facebook",
    color: "#2563eb", // blue-600
  },
  pilas: {
    key: "pilas",
    label: "Pilas",
    subtitle: "Tráfico y leads",
    color: "#7c3aed", // violet-600
  },
  youtube: {
    key: "youtube",
    label: "Youtube",
    subtitle: "Intención de búsqueda",
    color: "#dc2626", // red-600
  },
  google_display: {
    key: "google_display",
    label: "Google Display",
    subtitle: "Retargeting visual",
    color: "#f59e0b", // amber-500
  },
};

export const CHANNEL_ORDER: ChannelKey[] = [
  "meta",
  "pilas",
  "youtube",
  "google_display",
];

export function channelLabel(key: ChannelKey): string {
  return CHANNELS[key]?.label ?? key;
}

export function channelColor(key: ChannelKey): string {
  return CHANNELS[key]?.color ?? "#64748b";
}
