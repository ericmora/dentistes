import type { Copy } from "../content/copy";
import { Icon } from "./Icon";

export function SecurityDiagram({ copy }: { copy: Copy["security"]["diagram"] }) {
  const nodes = [
    { icon: "users" as const, label: copy.clinic, sub: copy.clinicSub },
    { icon: "lock" as const, label: copy.api, sub: copy.apiSub },
    { icon: "database" as const, label: copy.db, sub: copy.dbSub },
  ];

  return (
    <div className="border border-line-strong bg-pine-900 p-5 text-paper sm:p-7">
      <div className="grid-paper-dark border border-mint-200/15 p-4 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-mint-200/70">
            {copy.label}
          </span>
          <Icon name="shield" className="h-5 w-5 text-mint-300" />
        </div>

        <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {nodes.map((node, index) => (
            <div key={node.label} className="contents">
              <div className="border border-mint-200/20 bg-pine-800/80 px-3 py-4 text-center">
                <Icon name={node.icon} className="mx-auto h-5 w-5 text-mint-300" />
                <p className="mt-2 text-xs font-semibold text-paper">{node.label}</p>
                <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-mint-200/60">
                  {node.sub}
                </p>
              </div>
              {index < nodes.length - 1 ? (
                <div className="flex items-center justify-center text-mint-300/70">
                  <span className="hidden h-px w-6 bg-mint-300/30 sm:block" />
                  <Icon name="arrow" className="h-4 w-4 rotate-90 sm:rotate-0" />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {copy.badges.map((item) => (
            <span
              key={item}
              className="border border-mint-200/20 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-mint-200/70"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
