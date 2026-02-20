import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

export default function BidAutoGenerate({ lead, onBack, onSuccess }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState("analyze");
  const [pricingData, setPricingData] = useState(null);
  const [selectedBid, setSelectedBid] = useState(null);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const roofArea = lead.roof_area_sqft || 0;
      const areaSquares = roofArea / 100;

      const result = await base44.integrations.Core.InvokeLLM({
        add_context_from_internet: true,
        prompt: `You are a roofing market pricing analyst. Provide a dynamic pricing breakdown for a roofing contractor bidding on this job.

JOB DETAILS:
- Address: ${lead.address}
- Roof Area: ${roofArea} sq ft (${areaSquares.toFixed(1)} squares)
- Material: ${lead.material_type?.replace(/_/g, " ")}
- Estimated Market Total: $${lead.estimated_total?.toLocaleString()}

ANALYSIS NEEDED:
1. Research current labor rates for roofers in ${lead.address} for ${lead.material_type?.replace(/_/g, " ")} installation.
2. Calculate a competitive base bid using: labor_rate_per_square × area_squares + materials_cost + overhead + profit.
3. Return three bid levels:
   - aggressive (win rate ~70%, tighter margin)
   - competitive (win rate ~50%, standard margin)
   - premium (win rate ~30%, full margin)
4. Return materials_cost_per_sq, labor_rate_per_sq (market rate for this area), and suggested_overhead_pct, suggested_profit_pct.`,
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
            demand_level: { type: "string" },
          },
        },
      });

      return result;
    },
    onSuccess: (data) => {
      setPricingData(data);
      setStep("select");
      toast.success("Market analysis complete!");
    },
    onError: () => {
      toast.error("Failed to analyze market pricing");
    },
  });

  const submitBidMutation = useMutation({
    mutationFn: async (bidAmount) => {
      const bid = await base44.entities.RooferBid.create({
        lead_id: lead.id,
        quote_id: lead.quote_id,
        roofer_id: lead.roofer_id,
        roofer_company: lead.roofer_company,
        roofer_name: lead.roofer_name,
        roofer_phone: lead.roofer_phone,
        address: lead.address,
        roof_area_sqft: lead.roof_area_sqft,
        material_type: lead.material_type,
        estimated_total: lead.estimated_total,
        bid_amount: bidAmount,
        bid_notes: "Auto-generated bid based on market analysis",
        status: "submitted",
        is_auto_generated: true,
      });

      await base44.entities.Lead.update(lead.id, {
        roofer_bid: bidAmount,
        status: "proposal_sent",
      });

      return bid;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["bids"] });
      toast.success("Bid submitted successfully!");
      onSuccess();
    },
  });

  const bidOptions = pricingData
    ? [
        {
          label: "Aggressive",
          amount: pricingData.aggressive_bid,
          winRate: pricingData.aggressive_win_pct,
          description: "Lower price, higher win rate",
          color: "border-emerald-200 bg-emerald-50",
          textColor: "text-emerald-700",
        },
        {
          label: "Competitive",
          amount: pricingData.competitive_bid,
          winRate: pricingData.competitive_win_pct,
          description: "Balanced pricing",
          color: "border-blue-200 bg-blue-50",
          textColor: "text-blue-700",
        },
        {
          label: "Premium",
          amount: pricingData.premium_bid,
          winRate: pricingData.premium_win_pct,
          description: "Higher price, lower win rate",
          color: "border-violet-200 bg-violet-50",
          textColor: "text-violet-700",
        },
      ]
    : [];

  return (
    <div className="max-w-2xl">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {step === "analyze" && (
        <Card>
          <CardHeader>
            <CardTitle>Market Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-6">
              We'll analyze market rates and historical data to generate competitive bid options for this property.
            </p>
            <Button
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing market rates...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Start Analysis
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "select" && pricingData && (
        <Card>
          <CardHeader>
            <CardTitle>Select Bid Option</CardTitle>
            {pricingData.market_notes && (
              <p className="text-xs text-slate-500 mt-2">{pricingData.market_notes}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              {bidOptions.map((option, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedBid(option.amount)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedBid === option.amount
                      ? `${option.color} ${option.textColor} border-current`
                      : `${option.color} opacity-60 hover:opacity-100`
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold">{option.label}</p>
                      <p className="text-xs opacity-70">{option.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        ${option.amount.toLocaleString()}
                      </p>
                      <p className="text-xs opacity-70">~{Math.round(option.winRate)}% win rate</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={onBack}
                disabled={submitBidMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => submitBidMutation.mutate(selectedBid)}
                disabled={!selectedBid || submitBidMutation.isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {submitBidMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Selected Bid"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}