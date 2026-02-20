import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Star, ShieldCheck, Users, Home, ArrowRight } from "lucide-react";

const stats = [
  { icon: Home, value: "12,500+", label: "Roofs Quoted" },
  { icon: Users, value: "850+", label: "Licensed Roofers" },
  { icon: Star, value: "4.9/5", label: "Avg. Rating" },
  { icon: ShieldCheck, value: "$0", label: "Cost to Homeowner" },
];

export default function TrustSection() {
  const navigate = useNavigate();

  return (
    <section className="py-16 px-4 bg-slate-50 border-y border-slate-100">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm mb-3">
                <s.icon className="w-5 h-5 text-slate-700" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <Button
            onClick={() => navigate(createPageUrl("RoofersList"))}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
          >
            Browse All Available Roofers
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}