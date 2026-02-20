import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

export default function MaterialsList({ materials }) {
  if (!materials?.length) return null;

  const total = materials.reduce((sum, m) => sum + (m.total_cost || 0), 0);

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-slate-400" />
          <CardTitle className="text-lg font-semibold">Materials Breakdown</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {materials.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-800">{item.item}</p>
                <p className="text-xs text-slate-400">
                  {item.quantity} {item.unit} × ${item.unit_cost?.toFixed(2)}
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-900">${item.total_cost?.toLocaleString()}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t-2 border-slate-100 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">Total Materials</span>
          <span className="text-lg font-bold text-slate-900">${total.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}