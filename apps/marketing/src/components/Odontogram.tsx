import { useState } from "react";
import type { Copy } from "../content/copy";
import { Icon } from "./Icon";

type ToothState = "healthy" | "caries" | "restored" | "planned" | "missing";
type Surface = "top" | "left" | "center" | "right" | "bottom";

const STATES: ToothState[] = ["healthy", "caries", "restored", "planned", "missing"];
const SURFACES: Surface[] = ["top", "left", "center", "right", "bottom"];
const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const TOOTH_COUNT = UPPER.length + LOWER.length;

function nextState(current: ToothState): ToothState {
  const index = STATES.indexOf(current);
  return STATES[(index + 1) % STATES.length] ?? "healthy";
}

function surfacePath(surface: Surface, x: number, y: number) {
  switch (surface) {
    case "top":
      return `M${x + 10} ${y + 12} L${x + 34} ${y + 12} L${x + 30} ${y + 22} L${x + 14} ${y + 22} Z`;
    case "left":
      return `M${x + 10} ${y + 12} L${x + 14} ${y + 22} L${x + 14} ${y + 44} L${x + 10} ${y + 54} Z`;
    case "right":
      return `M${x + 34} ${y + 12} L${x + 30} ${y + 22} L${x + 30} ${y + 44} L${x + 34} ${y + 54} Z`;
    case "bottom":
      return `M${x + 14} ${y + 44} L${x + 30} ${y + 44} L${x + 34} ${y + 54} L${x + 10} ${y + 54} Z`;
    case "center":
      return `M${x + 14} ${y + 22} L${x + 30} ${y + 22} L${x + 30} ${y + 44} L${x + 14} ${y + 44} Z`;
  }
}

export function Odontogram({ copy }: { copy: Copy["odontogram"] }) {
  const [surfaces, setSurfaces] = useState<Record<string, ToothState>>({});
  const [selected, setSelected] = useState<{ tooth: number; surface: Surface; state: ToothState } | null>(
    null,
  );

  function stateFor(tooth: number, surface: Surface): ToothState {
    return surfaces[`${tooth}-${surface}`] ?? "healthy";
  }

  function toothState(tooth: number): ToothState {
    const states = SURFACES.map((surface) => stateFor(tooth, surface));
    return states.includes("missing")
      ? "missing"
      : states.includes("caries")
        ? "caries"
        : states.includes("restored")
          ? "restored"
          : states.includes("planned")
            ? "planned"
            : "healthy";
  }

  function paint(tooth: number, surface: Surface) {
    const missing = SURFACES.every((item) => stateFor(tooth, item) === "missing");
    const next = { ...surfaces };

    if (missing) {
      for (const item of SURFACES) next[`${tooth}-${item}`] = "healthy";
      setSurfaces(next);
      setSelected({ tooth, surface, state: "healthy" });
      return;
    }

    const key = `${tooth}-${surface}`;
    const following = nextState(surfaces[key] ?? "healthy");
    if (following === "missing") {
      for (const item of SURFACES) next[`${tooth}-${item}`] = "missing";
    } else {
      next[key] = following;
    }
    setSurfaces(next);
    setSelected({ tooth, surface, state: following });
  }

  function reset() {
    setSurfaces({});
    setSelected(null);
  }

  return (
    <div className="border border-line-strong bg-paper">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-ink">{copy.title}</p>
          <p className="mt-0.5 max-w-md text-[11px] leading-relaxed text-pine-600">{copy.hint}</p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 border border-line-strong px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-pine-600 transition hover:border-ink hover:text-ink"
        >
          <Icon name="spark" className="h-3.5 w-3.5" />
          {copy.reset}
        </button>
      </div>

      <div className="overflow-x-auto px-2 py-4">
        <svg
          viewBox="0 0 704 158"
          className="min-w-[640px] w-full"
          role="img"
          aria-label={copy.title}
        >
          <g>
            {UPPER.map((tooth, index) => {
              const x = index * 44;
              const y = 4;
              return (
                <g key={tooth}>
                  <rect
                    x={x + 8}
                    y={y + 9}
                    width={28}
                    height={48}
                    rx={8}
                    fill="none"
                    stroke="#0A1B17"
                    strokeOpacity={0.35}
                  />
                  {SURFACES.map((surface) => (
                    <path
                      key={surface}
                      d={surfacePath(surface, x, y)}
                      className="tooth-surface"
                      data-state={stateFor(tooth, surface)}
                      stroke="#0A1B17"
                      strokeOpacity={0.22}
                      strokeWidth={0.8}
                      role="button"
                      tabIndex={0}
                      aria-label={`${copy.tooth} ${tooth} ${copy.states[stateFor(tooth, surface)]}`}
                      onClick={() => paint(tooth, surface)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          paint(tooth, surface);
                        }
                      }}
                    />
                  ))}
                  <text
                    x={x + 22}
                    y={y + 70}
                    textAnchor="middle"
                    fontSize={7}
                    fill="#2A6B5C"
                    fontFamily="ui-monospace, monospace"
                  >
                    {tooth}
                  </text>
                </g>
              );
            })}
          </g>

          <g>
            {LOWER.map((tooth, index) => {
              const x = index * 44;
              const y = 88;
              return (
                <g key={tooth}>
                  <rect
                    x={x + 8}
                    y={y + 9}
                    width={28}
                    height={48}
                    rx={8}
                    fill="none"
                    stroke="#0A1B17"
                    strokeOpacity={0.35}
                  />
                  {SURFACES.map((surface) => (
                    <path
                      key={surface}
                      d={surfacePath(surface, x, y)}
                      className="tooth-surface"
                      data-state={stateFor(tooth, surface)}
                      stroke="#0A1B17"
                      strokeOpacity={0.22}
                      strokeWidth={0.8}
                      role="button"
                      tabIndex={0}
                      aria-label={`${copy.tooth} ${tooth} ${copy.states[stateFor(tooth, surface)]}`}
                      onClick={() => paint(tooth, surface)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          paint(tooth, surface);
                        }
                      }}
                    />
                  ))}
                  <text
                    x={x + 22}
                    y={y - 4}
                    textAnchor="middle"
                    fontSize={7}
                    fill="#2A6B5C"
                    fontFamily="ui-monospace, monospace"
                  >
                    {tooth}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-4 py-3">
        {STATES.map((state) => (
          <span key={state} className="inline-flex items-center gap-1.5 text-[10px] text-pine-600">
            <span
              className="h-2.5 w-2.5 border border-ink/20"
              style={{
                backgroundColor:
                  state === "healthy"
                    ? "#FBFCF9"
                    : state === "caries"
                      ? "#E5484D"
                      : state === "restored"
                        ? "#2F5BFF"
                        : state === "planned"
                          ? "#2BC894"
                          : "#0A1B17",
              }}
            />
            {copy.states[state]}
          </span>
        ))}
        <span className="ml-auto text-[10px] text-pine-500" aria-live="polite">
          {selected
            ? `${copy.selected}: ${copy.tooth} ${selected.tooth} · ${copy.states[selected.state]}`
            : `${copy.tooth}s: ${TOOTH_COUNT}`}
        </span>
      </div>
    </div>
  );
}
