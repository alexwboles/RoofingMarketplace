import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Package, Info, AlertTriangle } from "lucide-react";

// ─── Core calculation engine ─────────────────────────────────────────────────
function calculateMaterials(roofAnalysis, materialType) {
  if (!roofAnalysis) return null;

  const {
    total_area_sqft = 1500,
    pitch = "6/12",
    ridge_length_ft = 0,
    eave_length_ft = 0,
    valley_length_ft = 0,
    rake_length_ft = 0,
    num_facets = 4,
    obstacles = [],
    stories = 1,
    complexity = "moderate",
    waste_factor = 1.10,
  } = roofAnalysis;

  const roofingSquares = Math.ceil(total_area_sqft / 100); // 1 square = 100 sq ft
  const totalSqft = total_area_sqft;

  // Derive lineal feet with sensible fallbacks
  const ridgeLf = ridge_length_ft || Math.round(totalSqft / 40);
  const eaveLf  = eave_length_ft  || Math.round(totalSqft / 12);
  const valleyLf = valley_length_ft || 0;
  const rakeLf  = rake_length_ft  || Math.round(eaveLf * 0.6);
  const perimeterLf = eaveLf + rakeLf;

  // Waste factor (already in analysis, default 1.10)
  const wf = waste_factor || 1.10;

  // ── Shingles / Main roofing material ──────────────────────────────────────
  const shingleBundles = Math.ceil((totalSqft * wf) / 100 * 3); // ~3 bundles per square

  const isShingle = materialType?.includes("shingle") || !materialType;
  const isMetal = materialType?.includes("metal");
  const isTile = materialType?.includes("tile") || materialType === "slate";

  const mainMaterialRows = isShingle
    ? [
        { item: "Shingles", qty: shingleBundles, unit: "bundles", note: `@ ~3 bundles/sq × ${Math.ceil(totalSqft * wf / 100)} squares` },
        { item: "Hip & Ridge Cap Shingles", qty: Math.ceil((ridgeLf + rakeLf) / 35), unit: "bundles", note: `${ridgeLf + rakeLf} lf ÷ 35 lf/bundle` },
        { item: "Starter Strip", qty: Math.ceil(perimeterLf / 105), unit: "bundles", note: `${perimeterLf} lf perimeter` },
      ]
    : isMetal
    ? [
        { item: "Metal Roofing Panels", qty: Math.ceil(totalSqft * wf / 100), unit: "squares", note: `${totalSqft} ft² + ${Math.round((wf - 1) * 100)}% waste` },
        { item: "Ridge Cap (metal)", qty: Math.ceil(ridgeLf / 10), unit: "pieces", note: `${ridgeLf} lf ÷ 10 ft/piece` },
      ]
    : [
        { item: `${materialType?.replace(/_/g, " ")} tiles`, qty: Math.ceil(totalSqft * wf / 100), unit: "squares", note: `${totalSqft} ft² + waste` },
        { item: "Ridge Tiles", qty: Math.ceil(ridgeLf), unit: "linear ft", note: `ridge length` },
      ];

  // ── Underlayment ──────────────────────────────────────────────────────────
  const underlaymentRolls = Math.ceil((totalSqft * 1.05) / 1000); // 1 roll ≈ 1,000 sq ft
  const iceWaterSqft = eaveLf * 6; // 6 ft wide coverage along eaves
  const iceWaterRolls = Math.ceil(iceWaterSqft / 200); // 1 roll ≈ 200 sq ft

  // ── Flashing ──────────────────────────────────────────────────────────────
  const dripEdgePieces = Math.ceil(perimeterLf / 10); // 10 ft pieces
  const valleyFlashingPieces = valleyLf > 0 ? Math.ceil(valleyLf / 10) : 0;
  const chimneys = obstacles.filter(o => o.type?.toLowerCase().includes("chimney"));
  const skylights = obstacles.filter(o => o.type?.toLowerCase().includes("skylight"));
  const vents = obstacles.filter(o => o.type?.toLowerCase().includes("vent") || o.type?.toLowerCase().includes("pipe"));
  const chimneyFlashingKits = chimneys.reduce((s, c) => s + (c.count || 1), 0);
  const skylightFlashingKits = skylights.reduce((s, s2) => s + (s2.count || 1), 0);
  const pipeBoot = vents.reduce((s, v) => s + (v.count || 1), 0);

  // ── Fasteners & Accessories ───────────────────────────────────────────────
  const coilNails = Math.ceil(roofingSquares / 4); // 1 box per ~4 squares
  const roofingCaulk = Math.ceil((chimneyFlashingKits + skylightFlashingKits + pipeBoot + 1) * 1.5);

  // ── Ventilation ───────────────────────────────────────────────────────────
  const ridgeVents = Math.ceil(ridgeLf / 4); // 4 ft per vent
  const sofitVents = Math.ceil(eaveLf / 8);  // 8 ft spacing

  const rows = [
    // Main material
    { category: "Roofing Material", items: mainMaterialRows },

    // Underlayment
    {
      category: "Underlayment & Moisture Barrier",
      items: [
        { item: "Synthetic Underlayment", qty: underlaymentRolls, unit: "rolls (1,000 ft² ea)", note: `${totalSqft} ft² + 5% overlap` },
        { item: "Ice & Water Shield", qty: iceWaterRolls, unit: "rolls (200 ft² ea)", note: `${eaveLf} lf eave × 6 ft wide` },
      ]
    },

    // Flashing
    {
      category: "Flashing",
      items: [
        { item: "Drip Edge (10 ft)", qty: dripEdgePieces, unit: "pieces", note: `${perimeterLf} lf perimeter` },
        ...(valleyFlashingPieces > 0 ? [{ item: "Valley Flashing (10 ft)", qty: valleyFlashingPieces, unit: "pieces", note: `${valleyLf} lf valleys` }] : []),
        ...(chimneyFlashingKits > 0 ? [{ item: "Chimney Flashing Kit", qty: chimneyFlashingKits, unit: "kits", note: `${chimneyFlashingKits} chimney(s)` }] : []),
        ...(skylightFlashingKits > 0 ? [{ item: "Skylight Flashing Kit", qty: skylightFlashingKits, unit: "kits", note: `${skylightFlashingKits} skylight(s)` }] : []),
        { item: "Step Flashing (3×4 in)", qty: Math.ceil(eaveLf * 0.4), unit: "pieces", note: "wall/roof intersections" },
        ...(pipeBoot > 0 ? [{ item: "Pipe Boot / Vent Flashing", qty: pipeBoot, unit: "units", note: `${pipeBoot} vent(s)` }] : []),
        { item: "Roofing Caulk / Sealant", qty: roofingCaulk, unit: "tubes", note: "penetration sealing" },
      ]
    },

    // Fasteners
    {
      category: "Fasteners & Accessories",
      items: [
        { item: "Coil Roofing Nails (1¾ in)", qty: coilNails, unit: "boxes (7,200 ct)", note: `~${roofingSquares} squares` },
        { item: "Roofing Staples (optional)", qty: Math.ceil(underlaymentRolls / 2), unit: "boxes", note: "underlayment fastening" },
      ]
    },

    // Ventilation
    {
      category: "Ventilation",
      items: [
        { item: "Ridge Vent (4 ft)", qty: ridgeVents, unit: "pieces", note: `${ridgeLf} lf ridge` },
        { item: "Soffit Vent (16 in)", qty: sofitVents, unit: "units", note: `${eaveLf} lf eave line` },
      ]
    },
  ];

  const summary = {
    squares: roofingSquares,
    totalSqft,
    pitch,
    complexity,
    stories,
    wasteFactor: Math.round((wf - 1) * 100),
  };

  return { rows, summary };
}

// ─── Print function ───────────────────────────────────────────────────────────
function buildPrintHTML(project, rows, summary) {
  const matLabel = (project.material_type || "architectural_shingle").replace(/_/g, " ");
  const tableRows = rows.map(cat => [
    `<tr><td colspan="4" style="padding:12px 8px 4px;background:#f8fafc;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;">${cat.category}</td></tr>`,
    ...cat.items.map(i =>
      `<tr><td style="padding:8px;border-bottom:1px solid #f1f5f9;">${i.item}</td><td style="padding:8px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700;">${i.qty}</td><td style="padding:8px;border-bottom:1px solid #f1f5f9;">${i.unit}</td><td style="padding:8px;border-bottom:1px solid #f1f5f9;color:#94a3b8;font-size:12px;">${i.note || ""}</td></tr>`
    )
  ]).flat().join("");

  return `<!DOCTYPE html><html>
<head><meta charset="UTF-8"><title>Materials List — ${project.address}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;margin:0;padding:32px;color:#1e293b;}
  h1{font-size:24px;font-weight:800;margin:0 0 4px;}
  table{width:100%;border-collapse:collapse;margin-top:24px;}
  th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;padding-bottom:8px;border-bottom:2px solid #e2e8f0;font-weight:600;}
  th:nth-child(2){text-align:right;}
  .meta{display:flex;gap:24px;padding:16px 0;border-bottom:1px solid #e2e8f0;margin-top:16px;}
  .meta span{font-size:13px;color:#64748b;}
  .meta strong{color:#1e293b;}
  @media print{body{padding:16px;}}
</style></head>
<body>
<h1>Materials List</h1>
<p style="color:#64748b;margin:4px 0 0;">${project.address}</p>
<div class="meta">
  <span>Material: <strong>${matLabel}</strong></span>
  <span>Roof Area: <strong>${summary.totalSqft?.toLocaleString()} sq ft (${summary.squares} squares)</strong></span>
  <span>Pitch: <strong>${summary.pitch}</strong></span>
  <span>Complexity: <strong style="text-transform:capitalize">${summary.complexity}</strong></span>
  <span>Waste Factor: <strong>+${summary.wasteFactor}%</strong></span>
</div>
<table>
<thead><tr><th>Item</th><th style="text-align:right;">Qty</th><th>Unit</th><th>Notes</th></tr></thead>
<tbody>${tableRows}</tbody>
</table>
<p style="margin-top:40px;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:16px;">
  Generated by Roofing Marketplace · Quantities are estimates based on AI roof analysis. Field verification recommended.
</p>
</body></html>`;
}

// ─── Category color map ───────────────────────────────────────────────────────
const CAT_COLORS = {
  "Roofing Material": "text-amber-600 bg-amber-50",
  "Underlayment & Moisture Barrier": "text-blue-600 bg-blue-50",
  "Flashing": "text-indigo-600 bg-indigo-50",
  "Fasteners & Accessories": "text-slate-600 bg-slate-100",
  "Ventilation": "text-emerald-600 bg-emerald-50",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function MaterialsCalculator({ project }) {
  const result = useMemo(
    () => calculateMaterials(project.roof_analysis, project.material_type),
    [project.roof_analysis, project.material_type]
  );

  if (!result) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-slate-400 text-sm py-10 flex flex-col items-center gap-2">
          <Package className="w-8 h-8 text-slate-300" />
          No roof analysis data available to calculate materials.
        </CardContent>
      </Card>
    );
  }

  const { rows, summary } = result;

  const handlePrint = () => {
    const html = buildPrintHTML(project, rows, summary);
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  };

  const totalItems = rows.reduce((s, r) => s + r.items.length, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Package className="w-4 h-4 text-slate-500" />
            <h3 className="text-base font-semibold text-slate-800">Calculated Materials List</h3>
          </div>
          <p className="text-xs text-slate-400">Auto-derived from AI roof analysis · {totalItems} line items across {rows.length} categories</p>
        </div>
        <Button onClick={handlePrint} className="gap-2 bg-slate-800 hover:bg-slate-700 text-white">
          <Printer className="w-4 h-4" /> Print / Save
        </Button>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { label: "Roof Area", value: `${summary.totalSqft?.toLocaleString()} ft²` },
          { label: "Squares", value: summary.squares },
          { label: "Pitch", value: summary.pitch },
          { label: "Complexity", value: summary.complexity },
          { label: "Waste", value: `+${summary.wasteFactor}%` },
        ].map((s, i) => (
          <div key={i} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">{s.label}</p>
            <p className="text-sm font-bold text-slate-800 capitalize">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700">Quantities are estimates based on AI roof analysis. Always verify measurements on-site before ordering materials.</p>
      </div>

      {/* Category sections */}
      <div className="space-y-4">
        {rows.map((cat) => (
          <Card key={cat.category} className="overflow-hidden">
            <div className={`px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 ${CAT_COLORS[cat.category] || "text-slate-600 bg-slate-50"}`}>
              <Package className="w-3.5 h-3.5" />
              <span className="text-xs font-bold uppercase tracking-wider">{cat.category}</span>
              <Badge variant="outline" className="ml-auto text-[10px] h-5 border-current/30 bg-white/60">
                {cat.items.length} items
              </Badge>
            </div>
            <CardContent className="pt-0 pb-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs text-slate-400 font-medium py-2">Item</th>
                    <th className="text-right text-xs text-slate-400 font-medium py-2 w-16">Qty</th>
                    <th className="text-left text-xs text-slate-400 font-medium py-2 pl-3">Unit</th>
                    <th className="text-left text-xs text-slate-400 font-medium py-2 pl-3 hidden sm:table-cell">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {cat.items.map((item, i) => (
                    <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 text-slate-700 font-medium">{item.item}</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">{item.qty}</td>
                      <td className="py-2.5 pl-3 text-slate-500 text-xs">{item.unit}</td>
                      <td className="py-2.5 pl-3 text-slate-400 text-xs hidden sm:table-cell">{item.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}