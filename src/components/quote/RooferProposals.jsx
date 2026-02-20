import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Shield, CheckCircle2, Phone, Loader2, Award, TrendingDown, Zap, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`w-3 h-3 ${n <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
      ))}
    </div>
  );
}

function ProposalCard({ proposal, onSelect, isSelecting, selected }) {
  const tier = tierConfig[proposal.tier] || tierConfig.standard;
  const Icon = tier.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`border-2 ${tier.color} relative h-full flex flex-col`}>
        {tier.featured && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
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
              <StarRating rating={proposal.roofer_rating || 4.5} />
              <span className="text-xs text-slate-500 ml-1">({proposal.roofer_reviews})</span>
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
            {["Licensed & insured", proposal.roofer_specialty || "All materials", "Workmanship warranty", "Free inspection"].map((f, j) => (
              <li key={j} className="flex items-center gap-2 text-xs text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />{f}
              </li>
            ))}
          </ul>
          {proposal.roofer_phone && (
            <a href={`tel:${proposal.roofer_phone}`} className="flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 mb-3">
              <Phone className="w-3 h-3" />{proposal.roofer_phone}
            </a>
          )}
          <Button
            onClick={() => onSelect(proposal)}
            disabled={isSelecting || selected !== null}
            className={`w-full text-white ${tier.btn}`}
          >
            {isSelecting && selected === proposal.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : selected === proposal.id ? (
              <><CheckCircle2 className="w-4 h-4 mr-1" /> Selected!</>
            ) : "Choose This Roofer"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AllRooferRow({ roofer, onSelect, isSelecting, selected }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-500 shrink-0">
        {(roofer.company_name || roofer.roofer_company || "R")[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{roofer.company_name || roofer.roofer_company}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <StarRating rating={roofer.rating || roofer.roofer_rating || 4} />
          <span className="text-xs text-slate-400">({roofer.total_reviews || roofer.roofer_reviews || 0} reviews)</span>
          {roofer.service_areas?.length > 0 && (
            <span className="text-xs text-slate-400 flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />{roofer.service_areas[0]}
            </span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        {(roofer.roofer_bid) && <p className="text-sm font-bold text-slate-900">${roofer.roofer_bid?.toLocaleString()}</p>}
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs mt-1"
          onClick={() => onSelect(roofer)}
          disabled={isSelecting || selected !== null}
        >
          {selected === roofer.id ? <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" /> : null}
          Select
        </Button>
      </div>
    </div>
  );
}

export default function RooferProposals({ proposals, onSelect, isSelecting }) {
  const [selected, setSelected] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [allRoofers, setAllRoofers] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);

  const handleSelect = (proposal) => {
    setSelected(proposal.id);
    onSelect(proposal);
  };

  const handleShowAll = async () => {
    if (showAll) { setShowAll(false); return; }
    setLoadingAll(true);
    const roofers = await base44.entities.Roofer.filter({ status: "approved" }, "-rating", 50);
    setAllRoofers(roofers);
    setLoadingAll(false);
    setShowAll(true);
  };

  if (!proposals?.length) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">3 Top Matched Roofers For You</h2>
        <p className="text-sm text-slate-500 mt-1">AI-selected based on your project — or browse all available roofers below.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {proposals.map((proposal, i) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            onSelect={handleSelect}
            isSelecting={isSelecting}
            selected={selected}
          />
        ))}
      </div>

      {/* Browse all roofers */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <button
          onClick={handleShowAll}
          className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">Browse All Available Roofers</span>
            <span className="text-xs text-slate-400">— not happy with the suggestions?</span>
          </div>
          {loadingAll ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          ) : showAll ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        <AnimatePresence>
          {showAll && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-5 py-2 bg-white">
                {allRoofers.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center italic">No additional roofers found in the directory.</p>
                ) : (
                  allRoofers.map((r) => (
                    <AllRooferRow
                      key={r.id}
                      roofer={r}
                      onSelect={(roofer) => {
                        // Wrap roofer into a pseudo-proposal shape for onSelect
                        handleSelect({
                          id: roofer.id,
                          roofer_company: roofer.company_name,
                          roofer_name: roofer.contact_name,
                          roofer_phone: roofer.phone,
                          roofer_rating: roofer.rating,
                          roofer_reviews: roofer.total_reviews,
                          roofer_specialty: roofer.specialties?.join(", "),
                          roofer_bid: null,
                          tier: "standard",
                        });
                      }}
                      isSelecting={isSelecting}
                      selected={selected}
                    />
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}