import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Loader2, TrendingUp, DollarSign, Zap, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { toast } from "sonner";

function formatCurrency(n) {
  return "$" + Math.round(n || 0).toLocaleString();
}

export default function DynamicPricingEngine({ lead, roofer, onBidUpdate }) {
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState(null);
  const [expanded, setExpanded] = useState(false);

  // Roofer-adjustable variables
  const [overheadPct, setOverheadPct] = useState(15);   // % overhead markup
  const [profitPct, setProfitPct] = useState(20);         // % profit margin
  const [laborRate, setLaborRate] = useState(null);       // $/sq override
  const [customBid, setCustomBid] = useState("");

  const roofArea = lead?.roof_area_sqft || 0;
  const area_squares = roofArea / 100;

  const runPricingAnalysis = async () => {
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      add_context_from_internet: true,
      prompt: `You are a roofing market pricing analyst. Provide a dynamic pricing breakdown for a roofing contractor bidding on this job.

JOB DETAILS:
- Address: ${lead?.address}
- Roof Area: ${roofArea} sq ft (${area_squares.toFixed(1)} squares)
- Material: ${lead?.material_type?.replace(/_/g, " ")}
- Estimated Market Total: $${lead?.estimated_total?.toLocaleString()}

ROOFER PROFILE:
- Company: ${roofer?.company_name}
- Service Area: ${(roofer?.service_areas || []).join(", ")}
- Subscription Tier: ${roofer?.subscription_tier || "basic"}
- Leads Claimed: ${roofer?.leads_claimed || 0}
- Rating: ${roofer?.rating || "N/A"}
- Specialties: ${(roofer?.specialties || []).join(", ")}

ANALYSIS NEEDED:
1. Research current labor rates for roofers in ${lead?.address} for ${lead?.material_type?.replace(/_/g, " ")} installation.
2. Calculate a competitive base bid using: labor_rate_per_square × area_squares + materials_cost + overhead + profit.
3. Return three bid levels:
   - aggressive (win rate ~70%, tighter margin)
   - competitive (win rate ~50%, standard margin)
   - premium (win rate ~30%, full margin)
4. Identify win probability adjustments based on roofer's rating and leads history vs local competitors.
5. Return materials_cost_per_sq, labor_rate_per_sq (market rate for this area), and suggested_overhead_pct, suggested_profit_pct.`,
      response_json_schema: {
        type: "object",
        properties: {
          market_labor_rate_per_sq: { type: "number" },
          materials_cost_per_sq: { type: "number" },
          suggested_overhead_pct: { type: "number" },
          suggested_profit_pct: { type: "number" },
          aggressive_bid: { type: "number" },
          competitive_bid: { type: "number" },
          premium_bid: { type: "number" },
          aggressive_win_pct: { type: "number" },
          competitive_win_pct: { type: "number" },
          premium_win_pct: { type: "number" },
          market_notes: { type: "string" },
          competitor_count: { type: "number" },
          demand_level: { type: "string" }
        }
      }
    });

    setPricing(result);
    setLaborRate(result.market_labor_rate_per_sq);
    setOverheadPct(result.suggested_overhead_pct || 15);
    setProfitPct(result.suggested_profit_pct || 20);
    setLoading(false);
  };

  useEffect(() => {
    if (lead?.address && roofer) runPricingAnalysis();
  }, [lead?.id]);

  // Live calculated bid from roofer's variable inputs
  const effectiveLaborRate = laborRate || pricing?.market_labor_rate_per_sq || 0;
  const matCost = (pricing?.materials_cost_per_sq || 0) * area_squares;
  const laborCost = effectiveLaborRate * area_squares;
  const overhead = (matCost + laborCost) * (overheadPct / 100);
  const profit = (matCost + laborCost + overhead) * (profitPct / 100);
  const calculatedBid = Math.round(matCost + laborCost + overhead + profit);

  const handleApplyBid = async (amount) => {
    const bid = amount || calculatedBid;
    await base44.entities.Lead.update(lead.id, { roofer_bid: bid, status: "proposal_sent" });
    onBidUpdate && onBidUpdate(bid);
    toast.success(`Bid of ${formatCurrency(bid)} submitted!`);
  };

  if (!lead) return null;

  return (
    <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-600" />
            <CardTitle className="text-base font-semibold text-violet-900">Dynamic Pricing Engine</CardTitle>
            {pricing?.demand_level && (
              <Badge className={`text-xs border ${pricing.demand_level === "high" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : pricing.demand_level === "low" ? "bg-slate-50 text-slate-600 border-slate-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                {pricing.demand_level} demand
              </Badge>
            )}
          </div>
          <button onClick={() => setExpanded(e => !e)} className="text-violet-400 hover:text-violet-700 transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-6 gap-3 text-violet-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Analyzing market rates…</span>
          </div>
        ) : pricing ? (
          <>
            {/* Suggested bid tiers */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Aggressive", bid: pricing.aggressive_bid, win: pricing.aggressive_win_pct, color: "border-emerald-200 bg-emerald-50 text-emerald-800", btn: "bg-emerald-600 hover:bg-emerald-700" },
                { label: "Competitive", bid: pricing.competitive_bid, win: pricing.competitive_win_pct, color: "border-blue-200 bg-blue-50 text-blue-800", btn: "bg-blue-600 hover:bg-blue-700" },
                { label: "Premium", bid: pricing.premium_bid, win: pricing.premium_win_pct, color: "border-violet-200 bg-violet-50 text-violet-800", btn: "bg-violet-600 hover:bg-violet-700" },
              ].map(tier => (
                <div key={tier.label} className={`rounded-xl border p-3 text-center ${tier.color}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wide opacity-70 mb-1">{tier.label}</p>
                  <p className="text-xl font-extrabold">{formatCurrency(tier.bid)}</p>
                  <p className="text-[10px] mt-1 opacity-60">~{Math.round(tier.win || 0)}% win rate</p>
                  <Button size="sm" className={`w-full h-7 mt-2 text-xs text-white ${tier.btn}`} onClick={() => handleApplyBid(tier.bid)}>
                    Use This
                  </Button>
                </div>
              ))}
            </div>

            {/* Market notes */}
            {pricing.market_notes && (
              <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5 border border-slate-100">{pricing.market_notes}</p>
            )}

            {/* Expandable variable pricing controls */}
            {expanded && (
              <div className="space-y-4 pt-2 border-t border-violet-100">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Build Your Custom Bid</p>

                <div>
                  <div className="flex justify-between mb-1">
                    <Label className="text-xs text-slate-500">Labor Rate ($/sq)</Label>
                    <span className="text-xs font-bold text-slate-700">${laborRate?.toFixed(0) || "—"}</span>
                  </div>
                  <Slider
                    min={50} max={400} step={5}
                    value={[laborRate || pricing.market_labor_rate_per_sq]}
                    onValueChange={([v]) => setLaborRate(v)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>$50</span>
                    <span className="text-violet-500">Market: ${Math.round(pricing.market_labor_rate_per_sq)}</span>
                    <span>$400</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <Label className="text-xs text-slate-500">Overhead %</Label>
                    <span className="text-xs font-bold text-slate-700">{overheadPct}%</span>
                  </div>
                  <Slider min={5} max={40} step={1} value={[overheadPct]} onValueChange={([v]) => setOverheadPct(v)} />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <Label className="text-xs text-slate-500">Profit Margin %</Label>
                    <span className="text-xs font-bold text-slate-700">{profitPct}%</span>
                  </div>
                  <Slider min={5} max={50} step={1} value={[profitPct]} onValueChange={([v]) => setProfitPct(v)} />
                </div>

                {/* Live breakdown */}
                <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500"><span>Materials ({area_squares.toFixed(1)} sq × ${Math.round(pricing.materials_cost_per_sq)}/sq)</span><span className="font-semibold">{formatCurrency(matCost)}</span></div>
                  <div className="flex justify-between text-slate-500"><span>Labor ({area_squares.toFixed(1)} sq × ${Math.round(effectiveLaborRate)}/sq)</span><span className="font-semibold">{formatCurrency(laborCost)}</span></div>
                  <div className="flex justify-between text-slate-500"><span>Overhead ({overheadPct}%)</span><span className="font-semibold">{formatCurrency(overhead)}</span></div>
                  <div className="flex justify-between text-slate-500"><span>Profit ({profitPct}%)</span><span className="font-semibold">{formatCurrency(profit)}</span></div>
                  <div className="flex justify-between font-bold text-slate-900 text-sm pt-1.5 border-t border-slate-100">
                    <span>Calculated Bid</span>
                    <span className="text-violet-700">{formatCurrency(calculatedBid)}</span>
                  </div>
                </div>

                {/* Custom override */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <Input
                      type="number"
                      placeholder="Custom bid amount"
                      value={customBid}
                      onChange={(e) => setCustomBid(e.target.value)}
                      className="pl-8 h-9 text-sm"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleApplyBid(customBid ? parseInt(customBid) : calculatedBid)}
                    className="h-9 bg-violet-600 hover:bg-violet-700 text-white text-xs px-4 shrink-0"
                  >
                    <Zap className="w-3.5 h-3.5 mr-1" />
                    Submit Bid
                  </Button>
                </div>
              </div>
            )}

            <Button variant="ghost" size="sm" onClick={runPricingAnalysis} className="w-full h-8 text-xs text-slate-400 hover:text-violet-600">
              <RefreshCw className="w-3 h-3 mr-1" /> Refresh Market Analysis
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}