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
  Home, Navigation, Wind, Zap
} from "lucide-react";
import { toast } from "sonner";

const getComplexityColor = (c) => {
  if (c === "simple") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (c === "complex") return "bg-red-50 text-red-700 border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
};

export default function RoofReport({ analysis, onSave }) {
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

  const sections = [
    {
      title: "Primary Measurements",
      icon: Ruler,
      color: "text-blue-600",
      fields: [
        { key: "total_area_sqft", label: "Total Roof Area (sq ft)", type: "number" },
        { key: "pitch", label: "Pitch (rise/run)", type: "text", placeholder: "e.g. 6/12" },
        { key: "stories", label: "Stories", type: "number" },
        { key: "num_facets", label: "Number of Facets (Planes)", type: "number" },
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

        {/* Complexity - editable */}
        {editing && (
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

        {/* Summary row */}
        {!editing && (
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-4 text-white">
            <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Report Summary</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xl font-bold">{(analysis.total_area_sqft || 0).toLocaleString()}</p>
                <p className="text-xs text-slate-400">Total sq ft</p>
              </div>
              <div>
                <p className="text-xl font-bold">{analysis.pitch}</p>
                <p className="text-xs text-slate-400">Pitch</p>
              </div>
              <div>
                <p className="text-xl font-bold">{analysis.num_facets}</p>
                <p className="text-xs text-slate-400">Facets</p>
              </div>
              <div>
                <p className="text-xl font-bold">{analysis.obstacles?.length || 0}</p>
                <p className="text-xs text-slate-400">Obstacle types</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}