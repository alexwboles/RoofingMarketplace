import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

const MATERIALS = [
  { value: "3_tab_shingle", label: "3-Tab Shingle", range: "$4–$6/sq ft", tier: "economy" },
  { value: "architectural_shingle", label: "Architectural Shingle", range: "$5–$9/sq ft", tier: "standard" },
  { value: "premium_shingle", label: "Premium Shingle", range: "$8–$13/sq ft", tier: "premium" },
  { value: "metal_standing_seam", label: "Metal Standing Seam", range: "$12–$18/sq ft", tier: "premium" },
  { value: "metal_corrugated", label: "Corrugated Metal", range: "$7–$12/sq ft", tier: "standard" },
  { value: "tile_clay", label: "Clay Tile", range: "$15–$25/sq ft", tier: "premium" },
  { value: "tile_concrete", label: "Concrete Tile", range: "$10–$18/sq ft", tier: "premium" },
  { value: "slate", label: "Slate", range: "$20–$40/sq ft", tier: "premium" },
];

const TIER_COLORS = {
  economy: "bg-slate-50 text-slate-600 border-slate-200",
  standard: "bg-blue-50 text-blue-600 border-blue-200",
  premium: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function MaterialSelector({ project, onUpdate }) {
  const [selected, setSelected] = useState(project.material_type || "architectural_shingle");
  const [notes, setNotes] = useState(project.material_notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Project.update(project.id, { material_type: selected, material_notes: notes });
    setSaving(false);
    toast.success("Material preference saved!");
    onUpdate?.({ material_type: selected, material_notes: notes });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Replacement Roofing Material</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {MATERIALS.map((m) => (
          <button
            key={m.value}
            onClick={() => setSelected(m.value)}
            className={`rounded-xl border p-3 text-left transition-all ${
              selected === m.value
                ? "border-amber-400 bg-amber-50 ring-2 ring-amber-300 ring-offset-1"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-slate-800">{m.label}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${TIER_COLORS[m.tier]}`}>{m.tier}</span>
            </div>
            <span className="text-xs text-slate-400">{m.range}</span>
          </button>
        ))}
      </div>

      <div>
        <label className="text-xs text-slate-500 mb-1 block">Notes / Preferences</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Prefer dark grey color, match neighbor's roof, add ridge vents..."
          className="w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700 resize-none h-20 focus:outline-none focus:ring-1 focus:ring-amber-400"
        />
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Save Material Preference
      </Button>
    </div>
  );
}