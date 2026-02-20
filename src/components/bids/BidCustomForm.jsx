import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function BidCustomForm({ lead, onBack, onSuccess }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    bid_amount: "",
    materials_cost: "",
    labor_cost: "",
    bid_notes: "",
  });

  const submitBidMutation = useMutation({
    mutationFn: async (data) => {
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
        bid_amount: parseFloat(data.bid_amount),
        materials_cost: parseFloat(data.materials_cost) || 0,
        labor_cost: parseFloat(data.labor_cost) || 0,
        bid_notes: data.bid_notes,
        status: "submitted",
        is_auto_generated: false,
      });

      await base44.entities.Lead.update(lead.id, {
        roofer_bid: parseFloat(data.bid_amount),
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.bid_amount) {
      toast.error("Please enter a bid amount");
      return;
    }
    submitBidMutation.mutate(formData);
  };

  const totalBid =
    (parseFloat(formData.bid_amount) || 0);
  const materialsAndLabor =
    (parseFloat(formData.materials_cost) || 0) + (parseFloat(formData.labor_cost) || 0);
  const markup = totalBid - materialsAndLabor;
  const markupPct = materialsAndLabor > 0 ? Math.round((markup / materialsAndLabor) * 100) : 0;

  return (
    <div className="max-w-2xl">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <Card>
        <CardHeader>
          <CardTitle>Enter Your Bid Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bid Amount */}
            <div>
              <Label htmlFor="bid_amount" className="text-sm font-semibold mb-2 block">
                Total Bid Amount *
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="bid_amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.bid_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, bid_amount: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Market estimate: ${lead.estimated_total?.toLocaleString()}
              </p>
            </div>

            {/* Materials Cost */}
            <div>
              <Label htmlFor="materials_cost" className="text-sm font-semibold mb-2 block">
                Materials Cost (optional)
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="materials_cost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.materials_cost}
                  onChange={(e) =>
                    setFormData({ ...formData, materials_cost: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>

            {/* Labor Cost */}
            <div>
              <Label htmlFor="labor_cost" className="text-sm font-semibold mb-2 block">
                Labor Cost (optional)
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="labor_cost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.labor_cost}
                  onChange={(e) =>
                    setFormData({ ...formData, labor_cost: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>

            {/* Bid Notes */}
            <div>
              <Label htmlFor="bid_notes" className="text-sm font-semibold mb-2 block">
                Notes (optional)
              </Label>
              <Textarea
                id="bid_notes"
                placeholder="Add any special notes or details about this bid..."
                value={formData.bid_notes}
                onChange={(e) =>
                  setFormData({ ...formData, bid_notes: e.target.value })
                }
                className="h-24"
              />
            </div>

            {/* Summary */}
            {formData.bid_amount && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-sm font-semibold text-slate-900 mb-3">Bid Summary</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Materials</span>
                    <span className="font-semibold">
                      ${(parseFloat(formData.materials_cost) || 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Labor</span>
                    <span className="font-semibold">
                      ${(parseFloat(formData.labor_cost) || 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Markup</span>
                    <span className="font-semibold">
                      ${markup.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                      {markupPct > 0 && <span className="text-xs text-slate-500 ml-1">({markupPct}%)</span>}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                    <span>Total Bid</span>
                    <span className="text-violet-600">
                      ${totalBid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={submitBidMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-violet-600 hover:bg-violet-700"
                disabled={submitBidMutation.isPending}
              >
                {submitBidMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Bid"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}