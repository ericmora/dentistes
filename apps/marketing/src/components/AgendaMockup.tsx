import type { Copy } from "../content/copy";
import { Icon } from "./Icon";

const toneClass: Record<string, string> = {
  confirmed: "border-mint-400/60 bg-mint-100 text-pine-800",
  chair: "border-signal/30 bg-signal-soft text-[#1F43D6]",
  pending: "border-line-strong bg-paper text-pine-600",
};

export function AgendaMockup({ copy }: { copy: Copy["hero"]["panel"] }) {
  return (
    <div className="relative">
      <div className="absolute -inset-x-5 -inset-y-5 -z-10 bg-[radial-gradient(circle_at_70%_20%,rgba(201,245,228,0.9),transparent_60%)]" />
      <div className="overflow-hidden border border-line-strong bg-paper shadow-panel">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.18em] text-pine-500">DENTISTES / AGENDA</span>
            <span className="hidden h-3 w-px bg-line sm:block" />
            <span className="hidden text-xs text-pine-600 sm:block">{copy.subtitle}</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-100 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-pine-700">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-mint-500" />
            {copy.live}
          </span>
        </div>

        <div className="grid grid-cols-[2.4rem_repeat(3,1fr)] border-b border-line bg-chalk/70 font-mono text-[9px] uppercase tracking-[0.14em] text-pine-500">
          <div className="px-2 py-2.5">H</div>
          {copy.cabinets.map((cabinet) => (
            <div key={cabinet} className="border-l border-line px-2 py-2.5">
              {cabinet}
            </div>
          ))}
        </div>

        <div className="divide-y divide-line">
          {copy.appointments.map((appointment, index) => {
            const cabinetIndex = Math.max(0, copy.cabinets.indexOf(appointment.cabinet));
            return (
              <div
                key={`${appointment.time}-${appointment.name}`}
                className="grid grid-cols-[2.4rem_repeat(3,1fr)] items-stretch"
              >
                <div className="px-2 py-3 font-mono text-[10px] tabular text-pine-500">{appointment.time}</div>
                <div
                  className={[
                    "border-l border-line px-1.5 py-2",
                    index === 1 ? "bg-signal-soft/40" : "",
                  ].join(" ")}
                  style={{ gridColumn: `${cabinetIndex + 2} / span 1` }}
                >
                  <div
                    className={[
                      "flex min-h-[52px] flex-col justify-between gap-1 border px-2 py-1.5",
                      toneClass[appointment.tone] ?? toneClass.confirmed,
                    ].join(" ")}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold">{appointment.name}</p>
                      <p className="truncate text-[9px]">{appointment.treatment}</p>
                    </div>
                    <span className="font-mono text-[7px] uppercase tracking-[0.08em]">
                      {appointment.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line bg-chalk/60 px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] text-pine-600">
            <Icon name="calendar" className="h-4 w-4" />
            {copy.free}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-pine-600">
            <Icon name="whatsapp" className="h-4 w-4" />
            {copy.whatsapp}
          </div>
        </div>

        <p className="border-t border-line px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-pine-500">
          {copy.footer}
        </p>
      </div>
    </div>
  );
}
