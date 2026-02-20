import React from "react";
import { cn } from "@/lib/utils";

const materialTypes = [
  { value: "3_tab_shingle", label: "3-Tab Shingle", priceRange: "$", tier: "Economy" },
  { value: "architectural_shingle", label: "Architectural Shingle", priceRange: "$$", tier: "Popular" },
  { value: "premium_shingle", label: "Premium Shingle", priceRange: "$$$", tier: "Premium" },
  { value: "metal_standing_seam", label: "Standing Seam Metal", priceRange: "$$$$", tier: "Premium" },
  { value: "metal_corrugated", label: "Corrugated Metal", priceRange: "$$$", tier: "Mid-Range" },
  { value: "tile_clay", label: "Clay Tile", priceRange: "$$$$", tier: "Premium" },
  { value: "tile_concrete", label: "Concrete Tile", priceRange: "$$$", tier: "Mid-Range" },
  { value: "slate", label: "Natural Slate", priceRange: "$$$$$", tier: "Luxury" },
];

export default function MaterialTypeSelector({ value, onChange }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-700 mb-3">Select Material Type</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {materialTypes.map((mat) => (
          <button
            key={mat.value}
            onClick={() => onChange(mat.value)}
            className={cn(
              "text-left p-3 rounded-xl border-2 transition-all duration-200",
              value === mat.value
                ? "border-amber-400 bg-amber-50 shadow-sm"
                : "border-slate-100 hover:border-slate-200 bg-white"
            )}
          >
            <p className="text-sm font-semibold text-slate-800">{mat.label}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-slate-400">{mat.tier}</span>
              <span className="text-xs font-medium text-amber-600">{mat.priceRange}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}