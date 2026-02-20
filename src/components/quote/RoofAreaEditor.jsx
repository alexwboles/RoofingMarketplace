import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Satellite, Pencil, Save, X, Plus, Trash2 } from "lucide-react";

const COLORS = [
  { fill: "rgba(59,130,246,0.25)", stroke: "#3b82f6" },
  { fill: "rgba(234,179,8,0.25)", stroke: "#eab308" },
  { fill: "rgba(34,197,94,0.25)", stroke: "#22c55e" },
  { fill: "rgba(239,68,68,0.25)", stroke: "#ef4444" },
  { fill: "rgba(168,85,247,0.25)", stroke: "#a855f7" },
  { fill: "rgba(249,115,22,0.25)", stroke: "#f97316" },
];

const CANVAS_W = 640;
const CANVAS_H = 360;

function makeCenteredPolygon(i, total) {
  const cols = Math.min(total, 2);
  const rows = Math.ceil(total / cols);
  const blockW = Math.min(200, CANVAS_W * 0.55 / cols);
  const blockH = Math.min(130, CANVAS_H * 0.5 / rows);
  const col = i % cols;
  const row = Math.floor(i / cols);
  const gridW = cols * blockW + (cols - 1) * 10;
  const gridH = rows * blockH + (rows - 1) * 10;
  const startX = (CANVAS_W - gridW) / 2;
  const startY = (CANVAS_H - gridH) / 2;
  const x1 = startX + col * (blockW + 10);
  const y1 = startY + row * (blockH + 10);
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

  useEffect(() => {
    if (!sections?.length) { setLocalSections([]); return; }
    setLocalSections(
      sections.map((s, i) => ({
        ...s,
        points: s.points?.length >= 3 ? s.points : makeCenteredPolygon(i, sections.length),
      }))
    );
  }, [sections]);

  const getSVGPoint = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.max(0, Math.min(CANVAS_W, ((clientX - rect.left) / rect.width) * CANVAS_W)),
      y: Math.max(0, Math.min(CANVAS_H, ((clientY - rect.top) / rect.height) * CANVAS_H)),
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
        return { ...s, points: s.points.map((p, pi) => (pi === dragging.ptIdx ? pt : p)) };
      })
    );
  }, [dragging]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  const addSection = () => {
    const idx = localSections.length;
    const total = idx + 1;
    const updated = [
      ...localSections.map((s, i) => ({ ...s, points: makeCenteredPolygon(i, total) })),
      { name: `Section ${total}`, area_sqft: 300, color: idx % COLORS.length, points: makeCenteredPolygon(idx, total) },
    ];
    setLocalSections(updated);
    setActiveSec(updated.length - 1);
  };

  const removeSection = (i) => {
    setLocalSections(localSections.filter((_, idx) => idx !== i));
    setActiveSec(null);
  };

  const renameSection = (i, name) =>
    setLocalSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, name } : s)));

  const updateSqft = (i, val) => {
    const v = parseInt(val, 10);
    if (!isNaN(v) && v > 0)
      setLocalSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, area_sqft: v } : s)));
  };

  const handleSave = () => {
    const total = localSections.reduce((s, sec) => s + (sec.area_sqft || 0), 0);
    onSectionsChange(localSections, total);
    setEditing(false);
    setActiveSec(null);
  };

  const handleCancel = () => {
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
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/95 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Satellite className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-white">Satellite View</span>
          {totalSqft > 0 && (
            <span className="text-xs text-slate-400 ml-1">· {totalSqft.toLocaleString()} ft² detected</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button size="sm" variant="ghost" onClick={addSection} className="h-7 text-xs text-slate-300 hover:text-white">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Plane
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 text-xs text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" onClick={handleSave} className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-white">
                <Save className="w-3.5 h-3.5 mr-1" /> Save
              </Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="h-7 text-xs text-slate-300 hover:text-white">
              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit Outline
            </Button>
          )}
        </div>
      </div>

      {/* Satellite + SVG overlay */}
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
          src={`https://maps.google.com/maps?q=${encodedAddress}&t=k&z=21&output=embed`}
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
              <g key={si} onClick={() => { if (editing) setActiveSec(si); }} style={{ cursor: editing ? "pointer" : "default" }}>
                <polygon
                  points={pointsStr}
                  fill={color.fill}
                  stroke={color.stroke}
                  strokeWidth={isSelected ? 3 : 2}
                  strokeDasharray={isSelected ? "none" : "6 3"}
                  style={{ filter: isSelected ? `drop-shadow(0 0 4px ${color.stroke})` : "none" }}
                />
                {editing && pts.map((p, pi) => (
                  <circle
                    key={pi}
                    cx={p.x} cy={p.y}
                    r={isSelected ? 8 : 5}
                    fill={isSelected ? color.stroke : "white"}
                    stroke={color.stroke}
                    strokeWidth={2}
                    onMouseDown={(e) => handleMouseDown(si, pi, e)}
                    style={{ cursor: "grab", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}
                  />
                ))}
                <text
                  x={cx} y={cy - 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="700"
                  stroke="rgba(0,0,0,0.8)"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  paintOrder="stroke"
                >
                  {sec.name}
                </text>
                <text
                  x={cx} y={cy + 12}
                  textAnchor="middle"
                  fill="white"
                  fontSize="11"
                  fontWeight="600"
                  stroke="rgba(0,0,0,0.8)"
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

        {editing && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-blue-600/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap shadow-lg">
            Drag corner handles to reposition roof planes
          </div>
        )}
      </div>

      {/* Section breakdown — only shown in edit mode */}
      {editing && localSections.length > 0 && (
        <div className="px-4 py-3 bg-slate-800 border-t border-slate-700 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Edit Plane Areas</p>
          {localSections.map((sec, i) => {
            const color = COLORS[sec.color ?? i % COLORS.length];
            return (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color.stroke }} />
                <Input
                  value={sec.name}
                  onChange={(e) => renameSection(i, e.target.value)}
                  className="h-7 text-xs w-28 bg-slate-700 border-slate-600 text-white"
                />
                <Input
                  type="number"
                  value={sec.area_sqft}
                  onChange={(e) => updateSqft(i, e.target.value)}
                  className="h-7 text-xs w-24 bg-slate-700 border-slate-600 text-white"
                  min={1}
                />
                <span className="text-xs text-slate-400">ft²</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-300 ml-auto" onClick={() => removeSection(i)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })}
          <div className="flex justify-between pt-2 border-t border-slate-700">
            <span className="text-xs font-semibold text-slate-400">Total</span>
            <span className="text-sm font-bold text-white">{totalSqft.toLocaleString()} ft²</span>
          </div>
        </div>
      )}

      {/* View mode — compact summary below map */}
      {!editing && localSections.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-800/95 flex-wrap">
          {localSections.map((sec, i) => {
            const color = COLORS[sec.color ?? i % COLORS.length];
            return (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color.stroke }} />
                <span className="text-xs text-slate-300">{sec.name}</span>
                <span className="text-xs font-bold text-white">{sec.area_sqft?.toLocaleString()} ft²</span>
              </div>
            );
          })}
          <span className="ml-auto text-xs text-slate-400 font-semibold">Total: {totalSqft.toLocaleString()} ft²</span>
        </div>
      )}
    </div>
  );
}