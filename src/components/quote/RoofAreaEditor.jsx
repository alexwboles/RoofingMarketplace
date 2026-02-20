import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Satellite, Pencil, Save, X, Plus, Trash2, Info } from "lucide-react";

const COLORS = [
  { fill: "rgba(59,130,246,0.3)", stroke: "#3b82f6" },
  { fill: "rgba(234,179,8,0.3)", stroke: "#eab308" },
  { fill: "rgba(34,197,94,0.3)", stroke: "#22c55e" },
  { fill: "rgba(239,68,68,0.3)", stroke: "#ef4444" },
  { fill: "rgba(168,85,247,0.3)", stroke: "#a855f7" },
  { fill: "rgba(249,115,22,0.3)", stroke: "#f97316" },
];

const CANVAS_W = 640;
const CANVAS_H = 360;

/**
 * Generate a centered polygon for section i of total sections.
 * All sections are placed in the center of the satellite view,
 * tiled horizontally so they overlap the likely roof area.
 */
function makeCenteredPolygon(i, total) {
  const cols = Math.min(total, 2);
  const rows = Math.ceil(total / cols);
  const blockW = Math.min(220, CANVAS_W * 0.6 / cols);
  const blockH = Math.min(140, CANVAS_H * 0.55 / rows);
  const col = i % cols;
  const row = Math.floor(i / cols);
  // Center the whole grid in the canvas
  const gridW = cols * blockW + (cols - 1) * 8;
  const gridH = rows * blockH + (rows - 1) * 8;
  const startX = (CANVAS_W - gridW) / 2;
  const startY = (CANVAS_H - gridH) / 2;
  const x1 = startX + col * (blockW + 8);
  const y1 = startY + row * (blockH + 8);
  return [
    { x: x1, y: y1 },
    { x: x1 + blockW, y: y1 },
    { x: x1 + blockW, y: y1 + blockH },
    { x: x1, y: y1 + blockH },
  ];
}

export default function RoofAreaEditor({ address, sections, onSectionsChange }) {
  const svgRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [localSections, setLocalSections] = useState([]);
  const [activeSec, setActiveSec] = useState(null);
  const [dragging, setDragging] = useState(null);

  // Sync from parent — ensure polygons are always centered
  useEffect(() => {
    if (!sections?.length) { setLocalSections([]); return; }
    setLocalSections(
      sections.map((s, i) => ({
        ...s,
        // Only generate polygon if not already stored
        points: s.points?.length >= 3 ? s.points : makeCenteredPolygon(i, sections.length),
      }))
    );
  }, [sections]);

  const getSVGPoint = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(CANVAS_W, ((e.clientX - rect.left) / rect.width) * CANVAS_W)),
      y: Math.max(0, Math.min(CANVAS_H, ((e.clientY - rect.top) / rect.height) * CANVAS_H)),
    };
  };

  const handleMouseDown = (secIdx, ptIdx, e) => {
    if (!editing) return;
    e.stopPropagation();
    e.preventDefault();
    setDragging({ secIdx, ptIdx });
    setActiveSec(secIdx);
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !svgRef.current) return;
    e.preventDefault();
    const pt = getSVGPoint(e);
    setLocalSections((prev) =>
      prev.map((s, si) => {
        if (si !== dragging.secIdx) return s;
        const points = s.points.map((p, pi) => (pi === dragging.ptIdx ? pt : p));
        return { ...s, points };
      })
    );
  }, [dragging]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  const addSection = () => {
    const idx = localSections.length;
    const total = idx + 1;
    // Recalculate all polygons centered for new count
    const newSec = {
      name: `Section ${total}`,
      area_sqft: 300,
      color: idx % COLORS.length,
      points: makeCenteredPolygon(idx, total),
    };
    // Reposition existing sections too
    const updated = [
      ...localSections.map((s, i) => ({ ...s, points: makeCenteredPolygon(i, total) })),
      newSec,
    ];
    setLocalSections(updated);
    setActiveSec(updated.length - 1);
  };

  const removeSection = (i) => {
    const updated = localSections.filter((_, idx) => idx !== i);
    setLocalSections(updated);
    setActiveSec(null);
  };

  const renameSection = (i, name) => {
    setLocalSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, name } : s)));
  };

  const updateSqft = (i, val) => {
    const v = parseInt(val, 10);
    if (!isNaN(v) && v > 0) {
      setLocalSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, area_sqft: v } : s)));
    }
  };

  const handleSave = () => {
    const total = localSections.reduce((s, sec) => s + (sec.area_sqft || 0), 0);
    onSectionsChange(localSections, total);
    setEditing(false);
    setActiveSec(null);
  };

  const handleCancel = () => {
    // Reset to parent sections with centered polygons
    setLocalSections(
      (sections || []).map((s, i) => ({
        ...s,
        points: s.points?.length >= 3 ? s.points : makeCenteredPolygon(i, (sections || []).length),
      }))
    );
    setEditing(false);
    setActiveSec(null);
  };

  const totalSqft = localSections.reduce((s, sec) => s + (sec.area_sqft || 0), 0);
  const encodedAddress = encodeURIComponent(address || "");

  return (
    <Card className="border-slate-200 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-slate-400" />
            <CardTitle className="text-lg font-semibold">Satellite View & Roof Sections</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button size="sm" variant="outline" onClick={addSection} className="h-8 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Section
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel} className="h-8">
                  <X className="w-3.5 h-3.5 mr-1" /> Cancel
                </Button>
                <Button size="sm" onClick={handleSave} className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Save className="w-3.5 h-3.5 mr-1" /> Save
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="h-8">
                <Pencil className="w-3.5 h-3.5 mr-1" /> Edit Roof Area
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Map + SVG overlay */}
        <div
          className="relative bg-slate-900 select-none"
          style={{ height: CANVAS_H }}
          onMouseMove={editing ? handleMouseMove : undefined}
          onMouseUp={editing ? handleMouseUp : undefined}
          onMouseLeave={editing ? handleMouseUp : undefined}
        >
          <iframe
            title="Satellite View"
            width="100%"
            height={CANVAS_H}
            style={{ border: 0, pointerEvents: "none" }}
            loading="lazy"
            src={`https://maps.google.com/maps?q=${encodedAddress}&t=k&z=20&output=embed`}
          />

          <svg
            ref={svgRef}
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            className="absolute inset-0 w-full h-full"
            style={{ cursor: dragging ? "grabbing" : "default" }}
          >
            {localSections.map((sec, si) => {
              const color = COLORS[sec.color ?? si % COLORS.length];
              const pts = sec.points || [];
              if (pts.length < 3) return null;
              const isSelected = editing && activeSec === si;
              const pointsStr = pts.map((p) => `${p.x},${p.y}`).join(" ");
              const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
              const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;

              return (
                <g key={si} onClick={() => { if (editing) setActiveSec(si); }} style={{ cursor: "pointer" }}>
                  <polygon
                    points={pointsStr}
                    fill={color.fill}
                    stroke={color.stroke}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                  {/* Drag handles */}
                  {editing && pts.map((p, pi) => (
                    <circle
                      key={pi}
                      cx={p.x} cy={p.y}
                      r={isSelected ? 9 : 6}
                      fill={isSelected ? color.stroke : "rgba(255,255,255,0.85)"}
                      stroke={color.stroke}
                      strokeWidth={2}
                      onMouseDown={(e) => handleMouseDown(si, pi, e)}
                      style={{ cursor: "grab" }}
                    />
                  ))}
                  {/* Label */}
                  <text
                    x={cx} y={cy}
                    textAnchor="middle"
                    fill="white"
                    fontSize="11"
                    fontWeight="700"
                    stroke="rgba(0,0,0,0.75)"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    paintOrder="stroke"
                  >
                    {sec.area_sqft?.toLocaleString()} ft²
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
            <Satellite className="w-3 h-3 text-amber-400" />
            <span>AI roof analysis • {totalSqft.toLocaleString()} ft² total</span>
          </div>

          {editing && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-blue-600/90 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap">
              Drag corners to reposition • Edit sq ft in table below
            </div>
          )}
        </div>

        {/* Section breakdown table */}
        {localSections.length > 0 && (
          <div className="p-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Roof Section Breakdown</p>
            <div className="space-y-2">
              {localSections.map((sec, i) => {
                const color = COLORS[sec.color ?? i % COLORS.length];
                const pct = totalSqft > 0 ? Math.round((sec.area_sqft / totalSqft) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: color.stroke }} />
                    {editing ? (
                      <Input
                        value={sec.name}
                        onChange={(e) => renameSection(i, e.target.value)}
                        className="h-7 text-xs w-28"
                      />
                    ) : (
                      <span className="text-sm text-slate-700 w-28 truncate">{sec.name}</span>
                    )}
                    {editing ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={sec.area_sqft}
                          onChange={(e) => updateSqft(i, e.target.value)}
                          className="h-7 text-xs w-24"
                          min={1}
                        />
                        <span className="text-xs text-slate-400">ft²</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color.stroke }} />
                        </div>
                        <span className="text-xs font-semibold text-slate-600 w-24 text-right">{sec.area_sqft?.toLocaleString()} ft² ({pct}%)</span>
                      </>
                    )}
                    {editing && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => removeSection(i)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })}
              <div className="flex justify-between pt-2 border-t border-slate-100 mt-2">
                <span className="text-xs font-bold text-slate-500">Total</span>
                <span className="text-sm font-bold text-slate-800">{totalSqft.toLocaleString()} ft²</span>
              </div>
            </div>
          </div>
        )}

        {!localSections.length && editing && (
          <div className="p-4 bg-blue-50 border-t border-blue-100 text-center">
            <p className="text-xs text-blue-700">Click "Add Section" to add a roof section.</p>
          </div>
        )}

        <div className="p-3 bg-amber-50 border-t border-amber-100 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Sections are pre-centered on the satellite image. Drag corners to reposition, and edit the sq ft numbers directly for accurate totals.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}