import React from "react";
import { Ruler, Mountain, Triangle, Eye, Layers, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const getComplexityColor = (complexity) => {
  switch (complexity) {
    case "simple": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "moderate": return "bg-amber-50 text-amber-700 border-amber-200";
    case "complex": return "bg-red-50 text-red-700 border-red-200";
    default: return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

export default function RoofAnalysisCard({ analysis }) {
  if (!analysis) return null;

  const metrics = [
    { icon: Ruler, label: "Total Area", value: `${analysis.total_area_sqft?.toLocaleString()} sq ft` },
    { icon: Triangle, label: "Pitch", value: analysis.pitch },
    { icon: Layers, label: "Facets", value: analysis.num_facets },
    { icon: Mountain, label: "Peaks", value: analysis.num_peaks },
    { icon: ArrowUpDown, label: "Valleys", value: analysis.num_valleys },
    { icon: Eye, label: "Stories", value: analysis.stories },
  ];

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Roof Analysis</CardTitle>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getComplexityColor(analysis.complexity)}`}>
            {analysis.complexity} roof
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {metrics.map((m, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <m.icon className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-500">{m.label}</span>
              </div>
              <p className="text-lg font-bold text-slate-900">{m.value}</p>
            </div>
          ))}
        </div>

        {analysis.obstacles?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Obstacles Detected</p>
            <div className="flex flex-wrap gap-2">
              {analysis.obstacles.map((obs, i) => (
                <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                  {obs.count}× {obs.type}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Ridge", value: `${analysis.ridge_length_ft} ft` },
            { label: "Eave", value: `${analysis.eave_length_ft} ft` },
            { label: "Rake", value: `${analysis.rake_length_ft} ft` },
            { label: "Valley", value: `${analysis.valley_length_ft} ft` },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <p className="text-xs text-slate-400">{item.label}</p>
              <p className="text-sm font-semibold text-slate-700">{item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}