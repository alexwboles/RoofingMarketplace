import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Hammer, Package, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

export default function PriceEstimate({ materialsCost, laborCost, total, materialType }) {
  const formatMaterialType = (type) => {
    return (type || "architectural_shingle").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl mb-3 shadow-lg shadow-amber-200">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <p className="text-sm font-medium text-amber-800/70">Estimated Total</p>
            <p className="text-4xl font-bold text-slate-900 mt-1">
              ${total?.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-1">{formatMaterialType(materialType)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/60 rounded-xl p-4 text-center">
              <Package className="w-4 h-4 text-slate-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Materials</p>
              <p className="text-lg font-bold text-slate-800">${materialsCost?.toLocaleString()}</p>
            </div>
            <div className="bg-white/60 rounded-xl p-4 text-center">
              <Hammer className="w-4 h-4 text-slate-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Labor</p>
              <p className="text-lg font-bold text-slate-800">${laborCost?.toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-700">
              Roofers compete for your project — you could save 10-25% vs. single bids.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}