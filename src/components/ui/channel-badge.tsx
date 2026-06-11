import { CHANNELS } from "@/lib/constants";
import type { ChannelKey } from "@/lib/types";

export function ChannelBadge({
  channel,
  showSubtitle = false,
}: {
  channel: ChannelKey;
  showSubtitle?: boolean;
}) {
  const meta = CHANNELS[channel];
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: meta.color }}
        aria-hidden
      />
      <span className="font-medium text-slate-900">{meta.label}</span>
      {showSubtitle && (
        <span className="text-xs text-slate-400">· {meta.subtitle}</span>
      )}
    </span>
  );
}
