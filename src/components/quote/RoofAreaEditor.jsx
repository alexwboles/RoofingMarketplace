import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Satellite, Pencil, Save, X, Plus, Trash2, ZoomIn, ZoomOut, RotateCcw, Layers, MapPin, Loader2 } from "lucide-react";

const GOOGLE_API_KEY = "AIzaSyA0LIN1yEftyzWNZGVRBAms_FckT3Sg_2U";
const MAPBOX_API_KEY = "pk.eyJ1IjoiZmVlbGZyZWUwOTI4IiwiYSI6ImNtbHBuOHJwdDFnd3YzZW9iMGhpamQ3azgifQ.TR4NQUu-oNeK5M92inyKIw";

const COLORS = [
  { fill: "rgba(59,130,246,0.30)", stroke: "#3b82f6", label: "#bfdbfe" },
  { fill: "rgba(234,179,8,0.30)", stroke: "#eab308", label: "#fef08a" },
  { fill: "rgba(34,197,94,0.30)", stroke: "#22c55e", label: "#bbf7d0" },
  { fill: "rgba(239,68,68,0.30)", stroke: "#ef4444", label: "#fecaca" },
  { fill: "rgba(168,85,247,0.30)", stroke: "#a855f7", label: "#e9d5ff" },
  { fill: "rgba(249,115,22,0.30)", stroke: "#f97316", label: "#fed7aa" },
];

const CANVAS_W = 640;
const CANVAS_H = 400;

// Default zoom levels for static map
const ZOOM_LEVELS = [18, 19, 20, 21];

function makeCenteredPolygon(i, total) {
  const PAD = 40;
  const GAP = 16;
  const cols = Math.min(total, 2);
  const rows = Math.ceil(total / cols);
  const totalW = CANVAS_W - PAD * 2;
  const totalH = CANVAS_H - PAD * 2;
  const blockW = (totalW - (cols - 1) * GAP) / cols;
  const blockH = (totalH - (rows - 1) * GAP) / rows;
  const col = i % cols;
  const row = Math.floor(i / cols);
  const x1 = PAD + col * (blockW + GAP);
  const y1 = PAD + row * (blockH + GAP);
  const inset = 20;
  return [
    { x: x1 + inset, y: y1 + inset },
    { x: x1 + blockW - inset, y: y1 + inset },
    { x: x1 + blockW - inset, y: y1 + blockH - inset },
    { x: x1 + inset, y: y1 + blockH - inset },
  ];
}

function getSatelliteUrl(address, zoom) {
  return `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(address)}&zoom=${zoom}&size=${CANVAS_W}x${CANVAS_H}&maptype=satellite&scale=2&key=${GOOGLE_API_KEY}`;
}

async function geocodeAddress(address) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_API_KEY}&limit=1`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.features?.length) {
    const [lng, lat] = data.features[0].center;
    const place = data.features[0].place_name;
    return { lat, lng, place };
  }
  return null;
}

export default function RoofAreaEditor({ address, sections, onSectionsChange }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [localSections, setLocalSections] = useState([]);
  const [activeSec, setActiveSec] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [zoom, setZoom] = useState(20);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [geocoded, setGeocoded] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [mapStyle, setMapStyle] = useState("satellite");

  // Geocode address on mount
  useEffect(() => {
    if (!address) return;
    setGeocoding(true);
    geocodeAddress(address)
      .then(result => { setGeocoded(result); })
      .catch(() => {})
      .finally(() => setGeocoding(false));
  }, [address]);

  useEffect(() => {
    if (!sections?.length) { setLocalSections([]); return; }
    setLocalSections(
      sections.map((s, i) => ({
        ...s,
        points: s.points?.length >= 3 ? s.points : makeCenteredPolygon(i, sections.length),
      }))
    );
  }, [sections]);

  // Reset image loaded state when zoom changes
  useEffect(() => { setImgLoaded(false); setImgError(false); }, [zoom, address, mapStyle]);

  const getSVGPoint = useCallback((e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.max(0, Math.min(CANVAS_W, ((clientX - rect.left) / rect.width) * CANVAS_W)),
      y: Math.max(0, Math.min(CANVAS_H, ((clientY - rect.top) / rect.height) * CANVAS_H)),
    };
  }, []);

  const handleMouseDown = useCallback((secIdx, ptIdx, e) => {
    if (!editing) return;
    e.stopPropagation();
    e.preventDefault();
    setDragging({ secIdx, ptIdx });
    setActiveSec(secIdx);
  }, [editing]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !svgRef.current) return;
    e.preventDefault();
    const pt = getSVGPoint(e);
    setLocalSections(prev =>
      prev.map((s, si) => si !== dragging.secIdx ? s : {
        ...s,
        points: s.points.map((p, pi) => pi === dragging.ptIdx ? pt : p),
      })
    );
  }, [dragging, getSVGPoint]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  const addSection = () => {
    const idx = localSections.length;
    const total = idx + 1;
    const updated = [
      ...localSections.map((s, i) => ({ ...s, points: makeCenteredPolygon(i, total) })),
      { name: `Plane ${total}`, area_sqft: 300, color: idx % COLORS.length, points: makeCenteredPolygon(idx, total) },
    ];
    setLocalSections(updated);
    setActiveSec(updated.length - 1);
  };

  const removeSection = (i) => {
    setLocalSections(prev => prev.filter((_, idx) => idx !== i));
    setActiveSec(null);
  };

  const renameSection = (i, name) =>
    setLocalSections(prev => prev.map((s, idx) => idx === i ? { ...s, name } : s));

  const updateSqft = (i, val) => {
    const v = parseInt(val, 10);
    if (!isNaN(v) && v > 0)
      setLocalSections(prev => prev.map((s, idx) => idx === i ? { ...s, area_sqft: v } : s));
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

  const satelliteUrl = getSatelliteUrl(address, zoom);

  const getMapboxUrl = () => {
    if (!geocoded) return null;
    const { lat, lng } = geocoded;
    const style = mapStyle === "satellite" ? "mapbox/satellite-v9" : "mapbox/satellite-streets-v12";
    return `https://api.mapbox.com/styles/v1/${style}/static/${lng},${lat},${zoom},0/${CANVAS_W}x${CANVAS_H}@2x?access_token=${MAPBOX_API_KEY}`;
  };

  const [useMapbox, setUseMapbox] = useState(false);
  const imageUrl = useMapbox && geocoded ? getMapboxUrl() : satelliteUrl;

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-slate-900">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Satellite className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-white">Satellite View</span>
          </div>
          {geocoded && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 truncate max-w-[200px]">{geocoded.place}</span>
            </div>
          )}
          {geocoding && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Map source toggle */}
          <div className="flex bg-slate-800 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setUseMapbox(false)}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${!useMapbox ? "bg-amber-500 text-white" : "text-slate-400 hover:text-white"}`}
            >
              Google
            </button>
            <button
              onClick={() => setUseMapbox(true)}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${useMapbox ? "bg-amber-500 text-white" : "text-slate-400 hover:text-white"}`}
              disabled={!geocoded}
            >
              MapBox
            </button>
          </div>

          {useMapbox && (
            <button
              onClick={() => setMapStyle(s => s === "satellite" ? "streets" : "satellite")}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Toggle satellite/streets"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Zoom controls */}
          <div className="flex bg-slate-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setZoom(z => Math.max(ZOOM_LEVELS[0], z - 1))}
              className="px-2 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 py-1.5 text-xs font-mono text-slate-300 border-x border-slate-700 min-w-[36px] text-center">z{zoom}</span>
            <button
              onClick={() => setZoom(z => Math.min(ZOOM_LEVELS[ZOOM_LEVELS.length - 1], z + 1))}
              className="px-2 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {editing ? (
            <>
              <Button size="sm" variant="ghost" onClick={addSection} className="h-7 text-xs text-slate-300 hover:text-white">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Plane
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 text-xs text-red-400 hover:text-red-300">
                <X className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" onClick={handleSave} className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-white">
                <Save className="w-3.5 h-3.5 mr-1" /> Save
              </Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="h-7 text-xs text-slate-300 hover:text-white border border-slate-600">
              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit Planes
            </Button>
          )}
        </div>
      </div>

      {/* Map + overlay */}
      <div
        className="relative select-none overflow-hidden"
        style={{ height: CANVAS_H, background: "#0f172a" }}
        onMouseMove={editing ? handleMouseMove : undefined}
        onMouseUp={editing ? handleMouseUp : undefined}
        onMouseLeave={editing ? handleMouseUp : undefined}
        onTouchMove={editing ? handleMouseMove : undefined}
        onTouchEnd={editing ? handleMouseUp : undefined}
      >
        {/* Satellite image */}
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <p className="text-sm text-slate-400">Loading satellite imagery…</p>
          </div>
        )}

        {imgError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
            <Satellite className="w-10 h-10 text-slate-600" />
            <p className="text-sm text-slate-500">Satellite image unavailable</p>
            <p className="text-xs text-slate-600">{address}</p>
          </div>
        )}

        <img
          key={imageUrl}
          src={imageUrl}
          alt="Satellite view"
          className="w-full h-full object-cover"
          style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity 0.4s ease" }}
          onLoad={() => setImgLoaded(true)}
          onError={() => { setImgError(true); setImgLoaded(false); }}
        />

        {/* SVG polygon overlay */}
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
            const isSelected = activeSec === si;
            const pointsStr = pts.map(p => `${p.x},${p.y}`).join(" ");
            const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
            const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
            const pct = totalSqft > 0 ? Math.round((sec.area_sqft / totalSqft) * 100) : 0;

            return (
              <g key={si} onClick={() => editing && setActiveSec(si)} style={{ cursor: editing ? "pointer" : "default" }}>
                {/* Shadow for depth */}
                <polygon
                  points={pointsStr}
                  fill="rgba(0,0,0,0.15)"
                  stroke="none"
                  transform="translate(2,2)"
                />
                <polygon
                  points={pointsStr}
                  fill={color.fill}
                  stroke={color.stroke}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  strokeDasharray={editing && !isSelected ? "6 3" : "none"}
                  style={{
                    filter: isSelected ? `drop-shadow(0 0 6px ${color.stroke})` : "none",
                    transition: "all 0.15s ease"
                  }}
                />

                {/* Drag handles - only in edit mode */}
                {editing && pts.map((p, pi) => (
                  <g key={pi}>
                    <circle cx={p.x} cy={p.y} r={isSelected ? 10 : 7} fill="rgba(0,0,0,0.3)" />
                    <circle
                      cx={p.x} cy={p.y}
                      r={isSelected ? 8 : 5}
                      fill={isSelected ? color.stroke : "white"}
                      stroke={color.stroke}
                      strokeWidth={2}
                      onMouseDown={e => handleMouseDown(si, pi, e)}
                      onTouchStart={e => handleMouseDown(si, pi, e)}
                      style={{ cursor: "grab", filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }}
                    />
                  </g>
                ))}

                {/* Label */}
                <text
                  x={cx} y={cy - 6}
                  textAnchor="middle"
                  fill="white"
                  fontSize="11"
                  fontWeight="700"
                  stroke="rgba(0,0,0,0.9)"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  paintOrder="stroke"
                >
                  {sec.name}
                </text>
                <text
                  x={cx} y={cy + 9}
                  textAnchor="middle"
                  fill={color.label}
                  fontSize="10"
                  fontWeight="600"
                  stroke="rgba(0,0,0,0.8)"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  paintOrder="stroke"
                >
                  {sec.area_sqft?.toLocaleString()} ft² ({pct}%)
                </text>
              </g>
            );
          })}
        </svg>

        {/* Edit hint */}
        {editing && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-blue-600/90 backdrop-blur-sm text-white text-xs px-4 py-1.5 rounded-full pointer-events-none shadow-lg border border-blue-500/50">
            ✦ Drag corner handles to reposition roof planes
          </div>
        )}

        {/* View mode overlay: section badges */}
        {!editing && localSections.length > 0 && (
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 max-w-xs">
            {localSections.map((sec, i) => {
              const color = COLORS[sec.color ?? i % COLORS.length];
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow backdrop-blur-sm"
                  style={{ background: color.fill, border: `1px solid ${color.stroke}`, color: "white" }}
                >
                  <span style={{ background: color.stroke }} className="w-1.5 h-1.5 rounded-full inline-block" />
                  {sec.name}: {sec.area_sqft?.toLocaleString()} ft²
                </span>
              );
            })}
          </div>
        )}

        {/* Total sqft badge */}
        {!editing && totalSqft > 0 && (
          <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-xl border border-slate-600/60 shadow-lg">
            <span className="text-slate-400">Total: </span>
            <span className="font-bold text-amber-400">{totalSqft.toLocaleString()} ft²</span>
          </div>
        )}

        {/* Source badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-white/70 font-medium">{useMapbox ? "MapBox" : "Google"} Satellite</span>
        </div>
      </div>

      {/* Edit panel */}
      {editing && (
        <div className="px-4 py-3 bg-slate-800 border-t border-slate-700 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Roof Plane Areas</p>
            <span className="text-xs font-bold text-amber-400">{totalSqft.toLocaleString()} ft² total</span>
          </div>
          {localSections.map((sec, i) => {
            const color = COLORS[sec.color ?? i % COLORS.length];
            const isActive = activeSec === i;
            return (
              <div
                key={i}
                className={`flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer ${isActive ? "bg-slate-700 ring-1" : "hover:bg-slate-750"}`}
                style={isActive ? { ringColor: color.stroke } : {}}
                onClick={() => setActiveSec(i)}
              >
                <div className="w-3 h-3 rounded-sm shrink-0 shadow" style={{ background: color.stroke }} />
                <Input
                  value={sec.name}
                  onChange={e => renameSection(i, e.target.value)}
                  onClick={e => e.stopPropagation()}
                  className="h-7 text-xs w-28 bg-slate-700 border-slate-600 text-white"
                />
                <Input
                  type="number"
                  value={sec.area_sqft}
                  onChange={e => updateSqft(i, e.target.value)}
                  onClick={e => e.stopPropagation()}
                  className="h-7 text-xs w-24 bg-slate-700 border-slate-600 text-white"
                  min={1}
                />
                <span className="text-xs text-slate-400">ft²</span>
                <span className="text-xs text-slate-500 ml-1">
                  {totalSqft > 0 ? Math.round((sec.area_sqft / totalSqft) * 100) : 0}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-400 hover:text-red-300 ml-auto shrink-0"
                  onClick={e => { e.stopPropagation(); removeSection(i); }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })}
          {localSections.length === 0 && (
            <p className="text-xs text-slate-500 italic text-center py-2">No planes added. Click "Add Plane" to start.</p>
          )}
        </div>
      )}
    </div>
  );
}