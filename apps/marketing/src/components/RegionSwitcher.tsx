import { useEffect, useState } from "react";
import type { Lang } from "../content/languages";
import {
  REGION_DATA,
  getPreferredRegion,
  setPreferredRegion,
  type RegionData,
  type RegionId,
} from "../content/site";

interface RegionSwitcherProps {
  lang: Lang;
  className?: string;
  onRegionChange?: (region: RegionData) => void;
}

export function RegionSwitcher({ lang, className = "", onRegionChange }: RegionSwitcherProps) {
  const [currentRegion, setCurrentRegion] = useState<RegionData>(() => getPreferredRegion(lang));

  useEffect(() => {
    // If not manually overridden, attempt edge header detection or fallback
    const pref = getPreferredRegion(lang);
    setCurrentRegion(pref);
  }, [lang]);

  function handleChange(id: RegionId) {
    const found = REGION_DATA.find((r) => r.id === id);
    if (!found) return;
    setPreferredRegion(id);
    setCurrentRegion(found);
    if (onRegionChange) {
      onRegionChange(found);
    }
  }

  return (
    <div className={`inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] ${className}`}>
      <span className="text-pine-600 hidden sm:inline">Divisa:</span>
      <select
        aria-label="Selecciona la divisa i regió"
        value={currentRegion.id}
        onChange={(e) => handleChange(e.target.value as RegionId)}
        className="rounded border border-line bg-transparent px-2 py-1 text-ink focus:border-ink focus:outline-none cursor-pointer"
      >
        {REGION_DATA.map((r) => (
          <option key={r.id} value={r.id} className="bg-paper text-ink">
            {r.label}
          </option>
        ))}
      </select>
    </div>
  );
}
