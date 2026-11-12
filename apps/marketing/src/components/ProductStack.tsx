import { useState } from "react";
import type { Copy } from "../content/copy";
import type { Lang } from "../content/languages";
import { Icon } from "./Icon";
import { Odontogram } from "./Odontogram";

const MOCK: Record<
  Lang,
  {
    patient: string;
    age: string;
    alert: string;
    note: string;
    treatment: string;
    invoice: string;
    concept: string;
    amount: string;
    total: string;
    paid: string;
    waitlist: string;
    priority: string;
    waiting: string;
    call: string;
    priorityHigh: string;
    priorityMedium: string;
  }
> = {
  es: {
    patient: "Laia M.",
    age: "34 años",
    alert: "Alergia a penicilina",
    note: "Revisión semestral. Sin dolor. Se recomienda higiene y control de la pieza 26.",
    treatment: "Higiene + revisión",
    invoice: "Factura F-2026-0184",
    concept: "Higiene dental",
    amount: "75,00 €",
    total: "Total",
    paid: "Cobrada",
    waitlist: "Lista de espera",
    priority: "Prioridad",
    waiting: "En espera",
    call: "Llamar",
    priorityHigh: "Alta",
    priorityMedium: "Media",
  },
  en: {
    patient: "Laia M.",
    age: "34 years",
    alert: "Penicillin allergy",
    note: "Six-month check-up. No pain. Hygiene recommended and review of tooth 26.",
    treatment: "Hygiene + check-up",
    invoice: "Invoice F-2026-0184",
    concept: "Dental hygiene",
    amount: "€75.00",
    total: "Total",
    paid: "Paid",
    waitlist: "Waiting list",
    priority: "Priority",
    waiting: "Waiting",
    call: "Call",
    priorityHigh: "High",
    priorityMedium: "Medium",
  },
  ca: {
    patient: "Laia M.",
    age: "34 anys",
    alert: "Al·lèrgia a penicil·lina",
    note: "Revisió semestral. Sense dolor. Es recomana higiene i control de la peça 26.",
    treatment: "Higiene + revisió",
    invoice: "Factura F-2026-0184",
    concept: "Higiene dental",
    amount: "75,00 €",
    total: "Total",
    paid: "Cobrada",
    waitlist: "Llista d'espera",
    priority: "Prioritat",
    waiting: "En espera",
    call: "Trucar",
    priorityHigh: "Alta",
    priorityMedium: "Mitjana",
  },
};

function MiniAgenda({ copy }: { copy: Copy["hero"]["panel"] }) {
  return (
    <div className="border border-line bg-paper">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-pine-500">{copy.title}</span>
        <span className="inline-flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.1em] text-pine-600">
          <span className="h-1.5 w-1.5 rounded-full bg-mint-500" />
          {copy.live}
        </span>
      </div>
      <div className="grid grid-cols-3 border-b border-line bg-chalk/60">
        {copy.cabinets.map((cabinet) => (
          <div key={cabinet} className="border-r border-line px-2 py-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-pine-500 last:border-r-0">
            {cabinet}
          </div>
        ))}
      </div>
      <div className="space-y-1.5 p-2">
        {copy.appointments.slice(0, 5).map((appointment) => (
          <div
            key={`${appointment.time}-${appointment.name}`}
            className={[
              "flex items-center justify-between gap-2 border px-2 py-1.5",
              appointment.tone === "chair"
                ? "border-signal/30 bg-signal-soft text-[#1F43D6]"
                : appointment.tone === "pending"
                  ? "border-line-strong bg-paper text-pine-600"
                  : "border-mint-400/50 bg-mint-50 text-pine-700",
            ].join(" ")}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="font-mono text-[9px] tabular">{appointment.time}</span>
              <span className="truncate text-[11px] font-medium">{appointment.name}</span>
            </div>
            <span className="shrink-0 font-mono text-[7px] uppercase tracking-[0.08em]">
              {appointment.cabinet.replace(/\D/g, "")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function History({ lang }: { lang: Lang }) {
  const t = MOCK[lang];
  return (
    <div className="border border-line bg-paper">
      <div className="flex items-start justify-between border-b border-line px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-ink">{t.patient}</p>
          <p className="text-[11px] text-pine-500">
            {t.age} · ID 00482
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 border border-alert/30 bg-alert-soft px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-alert">
          <Icon name="alert" className="h-3 w-3" />
          {t.alert}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-[1fr_auto]">
        <div>
          <p className="mono-label">{t.treatment}</p>
          <p className="mt-2 text-xs leading-relaxed text-pine-700">{t.note}</p>
          <div className="mt-4 space-y-2">
            {["2026-11-12", "2026-05-04", "2025-10-21"].map((date, index) => (
              <div key={date} className="flex items-center gap-3 border-t border-line pt-2">
                <span className="font-mono text-[9px] text-pine-500">{date}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-mint-500" />
                <span className="text-[10px] text-pine-600">
                  {index === 0 ? t.treatment : index === 1 ? "Control" : "Primera visita"}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex h-24 w-24 items-center justify-center border border-line bg-chalk">
          <Icon name="tooth" className="h-10 w-10 text-pine-600" />
        </div>
      </div>
    </div>
  );
}

function Billing({ lang }: { lang: Lang }) {
  const t = MOCK[lang];
  return (
    <div className="border border-line bg-paper">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-pine-700">{t.invoice}</p>
        <span className="border border-mint-400/60 bg-mint-100 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-pine-700">
          {t.paid}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-[1fr_auto]">
        <div>
          <div className="flex items-baseline justify-between border-b border-line pb-3 text-xs">
            <span className="text-pine-600">{t.concept}</span>
            <span className="font-mono tabular text-ink">{t.amount}</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between text-sm font-semibold">
            <span>{t.total}</span>
            <span className="font-mono tabular">{t.amount}</span>
          </div>
          <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.1em] text-pine-500">
            IVA 0% · Verificable
          </p>
        </div>
        <div className="grid h-24 w-24 grid-cols-4 grid-rows-4 gap-0.5 border border-line bg-white p-1.5" aria-label="QR">
          {Array.from({ length: 16 }).map((_, index) => (
            <span
              key={index}
              className={index % 3 === 0 || index === 5 || index === 15 ? "bg-ink" : "bg-transparent"}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Waitlist({ lang }: { lang: Lang }) {
  const t = MOCK[lang];
  const rows = [
    { name: "Anna P.", priority: t.priorityHigh, time: "Hoy · 16:00" },
    { name: "Marc R.", priority: t.priorityMedium, time: "Mañana · 10:30" },
    { name: "Jordi S.", priority: t.priorityMedium, time: "Jueves · 09:00" },
  ];
  return (
    <div className="border border-line bg-paper">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="text-sm font-semibold text-ink">{t.waitlist}</p>
        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-pine-500">{t.waiting}</span>
      </div>
      <div className="divide-y divide-line">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-xs font-semibold text-ink">{row.name}</p>
              <p className="text-[10px] text-pine-500">{row.time}</p>
            </div>
            <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-pine-600">
              {t.priority}: {row.priority}
            </span>
            <span className="border border-line-strong px-2 py-1 font-mono text-[8px] uppercase tracking-[0.08em] text-signal">
              {t.call}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductStack({
  copy,
  lang,
}: {
  copy: Copy;
  lang: Lang;
}) {
  const [active, setActive] = useState(0);
  const module = copy.product.modules[active] ?? copy.product.modules[0];

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:gap-14">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="border-t border-line">
          {copy.product.modules.map((item, index) => {
            const current = index === active;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(index)}
                aria-pressed={current}
                className={[
                  "group flex w-full gap-4 border-b border-line py-4 text-left transition",
                  current ? "bg-white/55" : "hover:bg-white/35",
                ].join(" ")}
              >
                <span className="mt-1 font-mono text-[9px] tabular text-pine-500">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className={current ? "text-[15px] font-semibold text-ink" : "text-[15px] font-medium text-pine-700"}>
                      {item.title}
                    </span>
                    <Icon
                      name="arrow"
                      className={[
                        "h-4 w-4 shrink-0 transition",
                        current ? "text-signal" : "text-pine-500 group-hover:text-pine-700",
                      ].join(" ")}
                    />
                  </span>
                  {current ? (
                    <span className="mt-2 block text-xs leading-relaxed text-pine-600">{item.text}</span>
                  ) : null}
                  {current ? (
                    <span className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                      {item.bullets.map((bullet) => (
                        <span key={bullet} className="inline-flex items-center gap-1.5 text-[10px] text-pine-600">
                          <Icon name="check" className="h-3 w-3 text-mint-500" />
                          {bullet}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div key={module.id} className="animate-fade-in">
        <div className="mb-3 flex items-center justify-between">
          <span className="mono-label">{module.title}</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-pine-500">
            {String(active + 1).padStart(2, "0")} / {String(copy.product.modules.length).padStart(2, "0")}
          </span>
        </div>

        {module.id === "agenda" ? <MiniAgenda copy={copy.hero.panel} /> : null}
        {module.id === "odontograma" ? <Odontogram copy={copy.odontogram} /> : null}
        {module.id === "historial" ? <History lang={lang} /> : null}
        {module.id === "facturacion" ? <Billing lang={lang} /> : null}
        {module.id === "espera" ? <Waitlist lang={lang} /> : null}
      </div>
    </div>
  );
}
