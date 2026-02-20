import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Satellite, Pencil, Save, X, Plus, Trash2, Info, RotateCcw } from "lucide-react";

const COLORS = [
  { fill: "rgba(59,130,246,0.25)", stroke: "#3b82f6", label: "Section" },
  { fill: "rgba(234,179,8,0.25)", stroke: "#eab308", label: "Section" },
  { fill: "rgba(34,197,94,0.25)", stroke: "#22c55e", label: "Section" },
  { fill: "rgba(239,68,68,0.25)", stroke: "#ef4444", label: "Section" },
  { fill: "rgba(168,85,247,0.25)", stroke: "#a855f7", label: "Section" },
  { fill: "rgba(249,115,22,0.25)", stroke: "#f97316", label: "Section" },
];

function polygonArea(pts) {
  // Shoelace formula — returns area in canvas px²
  let area = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += pts[i].x * pts[j].y;
    area -= pts[j].x * pts[i].y;
  }
  return Math.abs(area) / 2;
}

function Polygon({ pts, color, selected, onSelect }) {
  if (pts.length < 2) return null;
  const points = pts.map((p) => `${p.x},${p.y}`).join(" ");
  return (
    <g onClick={onSelect} style={{ cursor: "pointer" }}>
      <polygon
        points={points}
        fill={color.fill}
        stroke={color.stroke}
        strokeWidth={selected ? 2.5 : 1.5}
      />
      {selected && pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={6}
          fill={color.stroke}
          stroke="white"
          strokeWidth={2}
        />
      ))}
    </g>
  );
}

export default function RoofAreaEditor({ address, sections, onSectionsChange }) {
  const svgRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [localSections, setLocalSections] = useState(sections || []);
  const [activeSec, setActiveSec] = useState(null);
  const [dragging, setDragging] = useState(null); // { secIdx, ptIdx }

  const CANVAS_W = 640;
  const CANVAS_H = 360;
  // Scale: each section stores its real sqft — we scale polygons to match
  // We display polygons sized proportionally; area_sqft is the source of truth

  useEffect(() => {
    setLocalSections(sections || []);
  }, [sections]);

  const getSVGPoint = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  };

  const pxAreaToSqft = (pxArea, originalSqft, originalPxArea) => {
    if (!originalPxArea) return originalSqft;
    return Math.round((pxArea / originalPxArea) * originalSqft);
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
    setLocalSections((prev) => {
      return prev.map((s, si) => {
        if (si !== dragging.secIdx) return s;
        const points = s.points.map((p, pi) => pi === dragging.ptIdx ? pt : p);
        const newPxArea = polygonArea(points);
        const origPxArea = polygonArea(s.points);
        return {
          ...s,
          points,
          area_sqft: pxAreaToSqft(newPxArea, s.area_sqft, origPxArea),
        };
      });
    });
  }, [dragging]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  const addSection = () => {
    const idx = localSections.length;
    const cx = 80 + (idx % 3) * 160;
    const cy = 80 + Math.floor(idx / 3) * 120;
    const newSec = {
      name: `Section ${idx + 1}`,
      points: [
        { x: cx, y: cy },
        { x: cx + 120, y: cy },
        { x: cx + 120, y: cy + 90 },
        { x: cx, y: cy + 90 },
      ],
      area_sqft: 800,
      color: idx % COLORS.length,
    };
    const updated = [...localSections, newSec];
    setLocalSections(updated);
    setActiveSec(updated.length - 1);
  };

  const removeSection = (i) => {
    const updated = localSections.filter((_, idx) => idx !== i);
    setLocalSections(updated);
    setActiveSec(null);
  };

  const renameSection = (i, name) => {
    setLocalSections((prev) => prev.map((s, idx) => idx === i ? { ...s, name } : s));
  };

  const handleSave = () => {
    const total = localSections.reduce((s, sec) => s + (sec.area_sqft || 0), 0);
    onSectionsChange(localSections, total);
    setEditing(false);
    setPlacing(false);
  };

  const handleCancel = () => {
    setLocalSections(sections || []);
    setEditing(false);
    setPlacing(false);
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
        >
          <iframe
            title="Satellite View"
            width="100%"
            height={CANVAS_H}
            style={{ border: 0, pointerEvents: editing ? "none" : "auto" }}
            loading="lazy"
            src={`https://maps.google.com/maps?q=${encodedAddress}&t=k&z=20&output=embed`}
          />

          {/* SVG polygon overlay */}
          <svg
            ref={svgRef}
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            className="absolute inset-0 w-full h-full"
            style={{ cursor: editing && placing ? "crosshair" : "default" }}
            onClick={handleSVGClick}
          >
            {localSections.map((sec, si) => {
              const color = COLORS[sec.color ?? si % COLORS.length];
              return (
                <g key={si}>
                  <Polygon
                    pts={sec.points || []}
                    color={color}
                    selected={editing && activeSec === si}
                    onSelect={() => { if (editing) { setActiveSec(si); setPlacing(false); } }}
                    dragging={dragging?.secIdx === si}
                  />
                  {/* Drag handles */}
                  {editing && activeSec === si && (sec.points || []).map((p, pi) => (
                    <circle
                      key={pi}
                      cx={p.x} cy={p.y} r={8}
                      fill="transparent"
                      onMouseDown={(e) => handleMouseDown(si, pi, e)}
                      style={{ cursor: "grab" }}
                    />
                  ))}
                  {/* Section label */}
                  {sec.points?.length >= 3 && (() => {
                    const cx = sec.points.reduce((s, p) => s + p.x, 0) / sec.points.length;
                    const cy = sec.points.reduce((s, p) => s + p.y, 0) / sec.points.length;
                    return (
                      <text x={cx} y={cy} textAnchor="middle" fill="white"
                        fontSize="11" fontWeight="600"
                        style={{ textShadow: "0 1px 2px black", paintOrder: "stroke" }}
                        stroke="rgba(0,0,0,0.6)" strokeWidth="3" strokeLinejoin="round">
                        {sec.area_sqft?.toLocaleString()} ft²
                      </text>
                    );
                  })()}
                </g>
              );
            })}
          </svg>

          {/* Overlay badge */}
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
            <Satellite className="w-3 h-3 text-amber-400" />
            <span>AI roof analysis • {totalSqft.toLocaleString()} ft² total</span>
          </div>

          {editing && placing && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-blue-600/90 text-white text-xs px-3 py-1.5 rounded-full">
              Click on the map to add vertices • click a section name to select it
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
                        className="h-7 text-xs w-36"
                      />
                    ) : (
                      <span className="text-sm text-slate-700 w-36 truncate">{sec.name}</span>
                    )}
                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color.stroke }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 w-20 text-right">{sec.area_sqft?.toLocaleString()} ft² ({pct}%)</span>
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
            <p className="text-xs text-blue-700">Click "Add Section" to start drawing roof sections on the map.</p>
          </div>
        )}

        <div className="p-3 bg-amber-50 border-t border-amber-100 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Drag the vertex handles to reshape roof sections. Each section's area is automatically calculated.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}