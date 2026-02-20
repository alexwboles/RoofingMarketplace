import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Ruler, Mountain, Layers, AlertCircle } from "lucide-react";

export default function QuoteSummary({ analysis }) {
  if (!analysis) return null;

  return (
    <Card className="border-slate-200">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Main metrics row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-slate-400 mb-1">Total Area</p>
              <p className="text-lg font-bold text-slate-900">{analysis.total_area_sqft?.toLocaleString()} sq ft</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Pitch</p>
              <p className="text-lg font-bold text-slate-900">{analysis.pitch}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Complexity</p>
              <p className="text-lg font-bold text-slate-900 capitalize">{analysis.complexity}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Difficulty</p>
              <p className="text-lg font-bold text-slate-900">{analysis.difficulty_score}/10</p>
            </div>
          </div>

          {/* Obstacles if present */}
          {analysis.obstacles?.length > 0 && (
            <div className="flex items-start gap-2 bg-orange-50 border border-orange-100 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-orange-900 mb-1">Obstacles Detected</p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.obstacles.map((obs, i) => (
                    <span key={i} className="text-xs bg-white border border-orange-200 text-orange-700 px-2 py-0.5 rounded-full">
                      {obs.count}× {obs.type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}