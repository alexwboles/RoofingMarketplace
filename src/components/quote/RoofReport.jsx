import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Pencil, Save, X, Plus, Trash2,
  Ruler, Triangle, Layers, Mountain, ArrowUpDown,
  Home, Navigation, Wind, ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "sonner";

const FACET_COLORS = ["bg-blue-500","bg-violet-500","bg-emerald-500","bg-amber-500","bg-rose-500","bg-teal-500","bg-cyan-500","bg-orange-500"];
const FACET_BORDER = ["border-blue-200","border-violet-200","border-emerald-200","border-amber-200","border-rose-200","border-teal-200","border-cyan-200","border-orange-200"];
const FACET_BG = ["bg-blue-50","bg-violet-50","bg-emerald-50","bg-amber-50","bg-rose-50","bg-teal-50","bg-cyan-50","bg-orange-50"];
const FACET_TEXT = ["text-blue-700","text-violet-700","text-emerald-700","text-amber-700","text-rose-700","text-teal-700","text-cyan-700","text-orange-700"];

function FacetsBreakdown({ analysis }) {
  const [selectedIdx, setSelectedIdx] = useState(null);
  const sections = analysis.roof_sections || [];
  const selected = selectedIdx !== null ? sections[selectedIdx] : null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Layers className="w-4 h-4 text-indigo-600" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Facets / Planes Breakdown</p>
        <span className="text-[10px] text-slate-400 ml-1">· tap a facet to view details</span>
      </div>

      {/* Facet tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        {sections.map((sec, i) => {
          const pct = analysis.total_area_sqft ? Math.round((sec.area_sqft / analysis.total_area_sqft) * 100) : 0;
          const isActive = selectedIdx === i;
          return (
            <button
              key={i}
              onClick={() => setSelectedIdx(isActive ? null : i)}
              className={`rounded-xl border p-3 text-left transition-all ${
                isActive
                  ? `${FACET_BG[i % FACET_COLORS.length]} ${FACET_BORDER[i % FACET_COLORS.length]} ring-2 ring-offset-1 ring-current`
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${FACET_COLORS[i % FACET_COLORS.length]}`} />
                <span className={`text-xs font-semibold ${isActive ? FACET_TEXT[i % FACET_COLORS.length] : "text-slate-700"}`}>{sec.name}</span>
                {isActive ? <ChevronUp className="w-3 h-3 ml-auto text-slate-400" /> : <ChevronDown className="w-3 h-3 ml-auto text-slate-400" />}
              </div>
              <p className="text-sm font-bold text-slate-900">{sec.area_sqft?.toLocaleString()} ft²</p>
              <div className="mt-1.5 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${FACET_COLORS[i % FACET_COLORS.length]}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{pct}% of total</p>
            </button>
          );
        })}
      </div>

      {/* Selected facet detail */}
      {selected && (
        <div className={`rounded-xl border p-4 mb-3 ${FACET_BG[selectedIdx % FACET_COLORS.length]} ${FACET_BORDER[selectedIdx % FACET_COLORS.length]}`}>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${FACET_TEXT[selectedIdx % FACET_COLORS.length]}`}>{selected.name} — Details</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/70 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-400">Area</p>
              <p className="text-sm font-bold text-slate-800">{selected.area_sqft?.toLocaleString()} ft²</p>
            </div>
            <div className="bg-white/70 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-400">Pitch</p>
              <p className="text-sm font-bold text-slate-800">{selected.pitch || analysis.pitch || "—"}</p>
            </div>
            <div className="bg-white/70 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-400">% of Roof</p>
              <p className="text-sm font-bold text-slate-800">
                {analysis.total_area_sqft ? Math.round((selected.area_sqft / analysis.total_area_sqft) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="text-xs font-semibold text-slate-500">Total Roof Area ({sections.length} facets)</span>
        <span className="text-sm font-bold text-slate-900">{(analysis.total_area_sqft || 0).toLocaleString()} ft²</span>
      </div>
    </div>
  );
}

const getComplexityColor = (c) => {
  if (c === "simple") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (c === "complex") return "bg-red-50 text-red-700 border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
};

export default function RoofReport({ analysis, onSave, aiSuggestions }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(analysis);

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
    toast.success("Roof measurements updated!");
  };

  const handleCancel = () => {
    setDraft(analysis);
    setEditing(false);
  };

  const updateField = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const addObstacle = () => {
    setDraft((prev) => ({
      ...prev,
      obstacles: [...(prev.obstacles || []), { type: "", count: 1 }],
    }));
  };

  const updateObstacle = (i, field, value) => {
    const updated = [...(draft.obstacles || [])];
    updated[i] = { ...updated[i], [field]: value };
    setDraft((prev) => ({ ...prev, obstacles: updated }));
  };

  const removeObstacle = (i) => {
    setDraft((prev) => ({
      ...prev,
      obstacles: prev.obstacles.filter((_, idx) => idx !== i),
    }));
  };

  if (!analysis) return null;

  const diffScore = analysis.difficulty_score || 0;
  const diffColor = diffScore >= 8 ? "text-red-600 bg-red-50 border-red-200"
    : diffScore >= 5 ? "text-amber-600 bg-amber-50 border-amber-200"
    : "text-emerald-600 bg-emerald-50 border-emerald-200";

  const sections = [
    {
      title: "Primary Measurements",
      icon: Ruler,
      color: "text-blue-600",
      fields: [
        { key: "total_area_sqft", label: "Total Roof Area (sq ft)", type: "number" },
        { key: "pitch", label: "Pitch (rise/run)", type: "text", placeholder: "e.g. 6/12" },
        { key: "pitch_multiplier", label: "Pitch Multiplier", type: "number" },
        { key: "num_facets", label: "Number of Facets", type: "number" },
      ],
    },
    {
      title: "Overhang & Waste",
      icon: ArrowUpDown,
      color: "text-cyan-600",
      fields: [
        { key: "overhang_inches", label: "Overhang (inches)", type: "number" },
        { key: "waste_factor", label: "Waste Factor", type: "number" },
      ],
    },
    {
      title: "Structural Features",
      icon: Mountain,
      color: "text-violet-600",
      fields: [
        { key: "num_peaks", label: "Peaks", type: "number" },
        { key: "num_valleys", label: "Valleys", type: "number" },
        { key: "num_hips", label: "Hips", type: "number" },
      ],
    },
    {
      title: "Linear Measurements",
      icon: Navigation,
      color: "text-emerald-600",
      fields: [
        { key: "ridge_length_ft", label: "Ridge Length (ft)", type: "number" },
        { key: "eave_length_ft", label: "Eave / Drip Edge (ft)", type: "number" },
        { key: "rake_length_ft", label: "Rake Length (ft)", type: "number" },
        { key: "valley_length_ft", label: "Valley Length (ft)", type: "number" },
      ],
    },
  ];

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-slate-400" />
            <CardTitle className="text-lg font-semibold">Roof Inspection Report</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <Badge className={`${getComplexityColor(analysis.complexity)} border text-xs`}>
                {analysis.complexity} roof
              </Badge>
            )}
            {editing ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel} className="h-8">
                  <X className="w-3.5 h-3.5 mr-1" /> Cancel
                </Button>
                <Button size="sm" onClick={handleSave} className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Save className="w-3.5 h-3.5 mr-1" /> Save Changes
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="h-8">
                <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="flex items-center gap-2 mb-3">
              <section.icon className={`w-4 h-4 ${section.color}`} />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{section.title}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {section.fields.map((field) => (
                <div key={field.key}>
                  {editing ? (
                    <div>
                      <Label className="text-xs text-slate-500 mb-1 block">{field.label}</Label>
                      <Input
                        type={field.type}
                        value={draft[field.key] ?? ""}
                        placeholder={field.placeholder}
                        onChange={(e) =>
                          updateField(
                            field.key,
                            field.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value
                          )
                        }
                        className="h-9 text-sm"
                      />
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-1">{field.label}</p>
                      <p className="text-base font-bold text-slate-800">
                        {field.key === "total_area_sqft"
                          ? `${(analysis[field.key] || 0).toLocaleString()} ft²`
                          : field.key.includes("_ft")
                          ? `${analysis[field.key] || 0} ft`
                          : analysis[field.key] ?? "—"}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Stories + Complexity - always editable-toggle */}
        {editing ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Number of Stories</Label>
              <Select value={String(draft.stories ?? 1)} onValueChange={(v) => updateField("stories", parseInt(v))}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 story</SelectItem>
                  <SelectItem value="2">2 stories</SelectItem>
                  <SelectItem value="3">3 stories</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Roof Complexity</Label>
              <Select value={draft.complexity} onValueChange={(v) => updateField("complexity", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="complex">Complex</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">Stories</p>
              <p className="text-base font-bold text-slate-800">{analysis.stories ?? 1}</p>
            </div>
          </div>
        )}

        {/* Obstacles */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-orange-500" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Obstacles & Penetrations</p>
            </div>
            {editing && (
              <Button variant="outline" size="sm" onClick={addObstacle} className="h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-2">
              {(draft.obstacles || []).map((obs, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    value={obs.type}
                    onChange={(e) => updateObstacle(i, "type", e.target.value)}
                    placeholder="e.g. Skylight, Chimney, Vent"
                    className="h-8 text-sm flex-1"
                  />
                  <Input
                    type="number"
                    value={obs.count}
                    onChange={(e) => updateObstacle(i, "count", parseInt(e.target.value) || 1)}
                    className="h-8 text-sm w-20"
                    min={1}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeObstacle(i)}
                    className="h-8 w-8 shrink-0 text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
              {!(draft.obstacles?.length) && (
                <p className="text-xs text-slate-400 italic">No obstacles added. Click "Add" to add one.</p>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {analysis.obstacles?.length ? (
                analysis.obstacles.map((obs, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-orange-50 border border-orange-100 text-orange-700 px-3 py-1.5 rounded-full">
                    <Zap className="w-3 h-3" />
                    {obs.count}× {obs.type}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No obstacles detected</span>
              )}
            </div>
          )}
        </div>

        {/* Roof Sections / Facets Breakdown */}
        {!editing && analysis.roof_sections?.length > 0 && (
          <FacetsBreakdown analysis={analysis} />
        )}

        {/* Difficulty Score */}
        {!editing && analysis.difficulty_score != null && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Triangle className="w-4 h-4 text-red-500" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Difficulty Assessment</p>
            </div>
            <div className={`rounded-xl border p-3 flex items-center gap-4 ${diffColor}`}>
              <div className="text-center shrink-0">
                <p className="text-3xl font-extrabold">{analysis.difficulty_score}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide">/ 10</p>
              </div>
              <div className="flex-1">
                <div className="w-full bg-white/60 rounded-full h-2 mb-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${diffScore >= 8 ? "bg-red-500" : diffScore >= 5 ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${(analysis.difficulty_score / 10) * 100}%` }}
                  />
                </div>
                {analysis.difficulty_factors?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {analysis.difficulty_factors.map((f, i) => (
                      <span key={i} className="text-[11px] bg-white/70 rounded-full px-2 py-0.5 border border-current/20">{f}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Summary row */}
        {!editing && (
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-4 text-white">
            <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Report Summary</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-xl font-bold">{(analysis.total_area_sqft || 0).toLocaleString()}</p>
                <p className="text-xs text-slate-400">Total sq ft</p>
              </div>
              <div>
                <p className="text-xl font-bold">{analysis.pitch}</p>
                <p className="text-xs text-slate-400">Pitch</p>
              </div>
              <div>
                <p className="text-xl font-bold">{analysis.pitch_multiplier ?? "—"}</p>
                <p className="text-xs text-slate-400">Pitch ×</p>
              </div>
              <div>
                <p className="text-xl font-bold">{analysis.stories ?? 1}</p>
                <p className="text-xs text-slate-400">Stories</p>
              </div>
              <div>
                <p className="text-xl font-bold">{analysis.difficulty_score ?? "—"}</p>
                <p className="text-xs text-slate-400">Difficulty</p>
              </div>
            </div>
          </div>
        )}

        {/* AI Recommendations — shown at bottom of report */}
        {!editing && aiSuggestions?.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">AI Recommendations for Your Property</p>
            {aiSuggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5 shrink-0">✦</span>
                <p className="text-sm text-amber-900">{s}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}