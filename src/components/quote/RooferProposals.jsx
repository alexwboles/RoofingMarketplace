import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Shield, CheckCircle2, Phone, Loader2, Award, TrendingDown, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const tierConfig = {
  economy: {
    label: "Economy",
    icon: TrendingDown,
    color: "border-slate-200",
    headerBg: "bg-slate-50",
    badge: "bg-slate-100 text-slate-600",
    btn: "bg-slate-700 hover:bg-slate-800",
    desc: "Best price, solid quality",
  },
  standard: {
    label: "Standard",
    icon: Shield,
    color: "border-amber-300 shadow-amber-100 shadow-lg",
    headerBg: "bg-gradient-to-r from-amber-50 to-orange-50",
    badge: "bg-amber-100 text-amber-700",
    btn: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
    desc: "Most popular choice",
    featured: true,
  },
  premium: {
    label: "Premium",
    icon: Award,
    color: "border-violet-200",
    headerBg: "bg-violet-50",
    badge: "bg-violet-100 text-violet-700",
    btn: "bg-violet-700 hover:bg-violet-800",
    desc: "Top-rated contractor",
  },
};

export default function RooferProposals({ proposals, onSelect, isSelecting }) {
  const [selected, setSelected] = useState(null);

  if (!proposals?.length) return null;

  const handleSelect = (proposal) => {
    setSelected(proposal.id);
    onSelect(proposal);
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900">3 Matched Roofers For You</h2>
        <p className="text-sm text-slate-500 mt-1">
          We matched your project with top-rated local contractors. Choose your preferred option.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {proposals.map((proposal, i) => {
          const tier = tierConfig[proposal.tier] || tierConfig.standard;
          const Icon = tier.icon;
          return (
            <motion.div
              key={proposal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={`border-2 ${tier.color} relative h-full flex flex-col`}>
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      ⭐ Most Popular
                    </span>
                  </div>
                )}

                <CardHeader className={`${tier.headerBg} rounded-t-xl pb-3`}>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={`${tier.badge} text-xs border-0`}>
                      <Icon className="w-3 h-3 mr-1" />
                      {tier.label}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-semibold">{proposal.roofer_rating?.toFixed(1)}</span>
                      <span className="text-xs text-slate-400">({proposal.roofer_reviews})</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900">{proposal.roofer_company}</h3>
                  <p className="text-xs text-slate-500">{proposal.roofer_name}</p>
                  <p className="text-xs text-slate-400 italic mt-0.5">{tier.desc}</p>
                </CardHeader>

                <CardContent className="pt-4 flex-1 flex flex-col">
                  <div className="text-center mb-4">
                    <p className="text-3xl font-bold text-slate-900">${proposal.roofer_bid?.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">All-inclusive bid</p>
                  </div>

                  <ul className="space-y-1.5 mb-4 flex-1">
                    {[
                      "Licensed & insured",
                      `${proposal.roofer_specialty || "All materials"}`,
                      "Workmanship warranty",
                      "Free inspection",
                    ].map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {proposal.roofer_phone && (
                    <a
                      href={`tel:${proposal.roofer_phone}`}
                      className="flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 mb-3"
                    >
                      <Phone className="w-3 h-3" />
                      {proposal.roofer_phone}
                    </a>
                  )}

                  <Button
                    onClick={() => handleSelect(proposal)}
                    disabled={isSelecting || selected !== null}
                    className={`w-full text-white ${tier.btn}`}
                  >
                    {isSelecting && selected === proposal.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : selected === proposal.id ? (
                      <><CheckCircle2 className="w-4 h-4 mr-1" /> Selected!</>
                    ) : (
                      "Choose This Roofer"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}