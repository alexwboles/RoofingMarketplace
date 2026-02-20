import React from "react";
import { Shield, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const options = [
  {
    value: "insurance",
    icon: Shield,
    label: "Insurance Claim",
    desc: "Roof damage covered by homeowner's insurance",
    color: "border-blue-300 bg-blue-50",
    activeColor: "border-blue-500 bg-blue-100 ring-2 ring-blue-400 ring-offset-1",
    iconColor: "text-blue-600",
  },
  {
    value: "personal",
    icon: Wallet,
    label: "Personal Payment",
    desc: "Paying out-of-pocket or via financing",
    color: "border-slate-200 bg-slate-50",
    activeColor: "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400 ring-offset-1",
    iconColor: "text-emerald-600",
  },
];

export default function PaymentTypeSelector({ value, onChange }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700 mb-3">How are you paying for this project?</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all",
                active ? opt.activeColor : opt.color,
                "hover:border-slate-400"
              )}
            >
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", active ? "bg-white shadow-sm" : "bg-white/60")}>
                <Icon className={cn("w-5 h-5", opt.iconColor)} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
      {value === "insurance" && (
        <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
          <strong>Insurance tip:</strong> Your estimate can be submitted directly to your adjuster. Roofers in our network are experienced with insurance claims.
        </div>
      )}
    </div>
  );
}