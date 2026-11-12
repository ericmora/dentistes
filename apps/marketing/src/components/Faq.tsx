import type { Copy } from "../content/copy";
import { Icon } from "./Icon";

export function Faq({ copy, compact = false }: { copy: Copy["faq"]; compact?: boolean }) {
  return (
    <div className={compact ? "" : "grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14"}>
      {!compact ? (
        <div>
          <p className="mono-label">{copy.index}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-4xl">
            {copy.title}
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-pine-600">{copy.intro}</p>
        </div>
      ) : null}
      <div className="border-t border-line">
        {copy.items.map((item, index) => (
          <details key={item.q} className="group border-b border-line">
            <summary className="flex cursor-pointer items-start gap-4 py-4 [&::-webkit-details-marker]:hidden">
              <span className="mt-0.5 font-mono text-[9px] tabular text-pine-500">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 text-sm font-medium leading-relaxed text-ink">{item.q}</span>
              <Icon
                name="plus"
                className="mt-0.5 h-4 w-4 shrink-0 text-pine-500 transition group-open:rotate-45"
              />
            </summary>
            <div className="pb-5 pl-[2.1rem] pr-8">
              <p className="text-sm leading-relaxed text-pine-600">{item.a}</p>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
