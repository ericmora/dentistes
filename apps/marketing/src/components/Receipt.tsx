import type { Copy } from "../content/copy";
import { Icon } from "./Icon";

export function Receipt({ copy }: { copy: Copy["receipt"] }) {
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="border border-line bg-white/35 p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-pine-500">
              {copy.traditional.label}
            </p>
            <span className="border border-line px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-pine-500">
              A
            </span>
          </div>
          <div className="mt-5">
            {copy.traditional.lines.map((line) => (
              <div key={line.label} className="ledger-row grid-cols-[1fr_auto] text-sm">
                <span className="text-pine-600">{line.label}</span>
                <span className="font-mono tabular text-ink">{line.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-baseline justify-between border-t border-ink/40 pt-4">
            <span className="text-xs font-medium text-pine-600">{copy.traditional.totalLabel}</span>
            <span className="font-mono text-2xl font-semibold tabular text-ink">
              {copy.traditional.total}
            </span>
          </div>
        </div>

        <div className="relative border border-pine-700 bg-pine-900 p-5 text-paper sm:p-7">
          <div className="absolute -right-2 -top-2 hidden rotate-3 border border-mint-300 bg-mint-200 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-pine-900 sm:block">
            {copy.saving}
          </div>
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mint-200/70">
              {copy.dentistes.label}
            </p>
            <span className="border border-mint-200/30 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-mint-200/70">
              B
            </span>
          </div>
          <div className="mt-5">
            {copy.dentistes.lines.map((line) => (
              <div
                key={line.label}
                className="grid grid-cols-[1fr_auto] items-baseline gap-4 border-t border-mint-200/15 py-5 text-sm"
              >
                <span className="text-mint-100/80">{line.label}</span>
                <span className="font-mono tabular text-paper">{line.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-baseline justify-between border-t border-mint-200/40 pt-4">
            <span className="text-xs font-medium text-mint-100/80">{copy.dentistes.totalLabel}</span>
            <span className="font-mono text-2xl font-semibold tabular text-mint-200">
              {copy.dentistes.total}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-mint-200/80 sm:hidden">
            <Icon name="check" className="h-4 w-4" />
            {copy.saving}
          </div>
        </div>
      </div>
      <p className="mt-4 max-w-2xl text-[11px] leading-relaxed text-pine-500">{copy.note}</p>
    </div>
  );
}
