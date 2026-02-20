import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Edit2, Save, X, Zap } from "lucide-react";
import { toast } from "sonner";

export default function RooferBiddingInterface({ lead, roofer, onBidSubmit, onAutoGenerate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [bidData, setBidData] = useState({
    bid_amount: lead?.roofer_bid || Math.round(lead?.estimated_total * 1.15) || 0,
    materials_cost: 0,
    labor_cost: 0,
    bid_notes: "",
  });

  const handleAutoGenerate = async () => {
    const generatedBid = Math.round(lead?.estimated_total * (1 + (roofer?.default_markup_percentage || 15) / 100));
    setBidData({
      ...bidData,
      bid_amount: generatedBid,
    });
    toast.success("Bid auto-generated from your template!");
  };

  const handleSubmit = async () => {
    if (onBidSubmit) {
      await onBidSubmit(bidData);
      setIsEditing(false);
      toast.success("Bid submitted!");
    }
  };

  const difference = bidData.bid_amount - lead?.estimated_total;
  const percentDiff = lead?.estimated_total ? ((difference / lead.estimated_total) * 100).toFixed(1) : 0;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Submit Your Bid</CardTitle>
          {roofer?.auto_bid_enabled && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleAutoGenerate}
              className="border-blue-300"
            >
              <Zap className="w-3.5 h-3.5 mr-1" /> Auto-Generate
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Your Bid Amount</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-slate-500">$</span>
                <Input
                  type="number"
                  value={bidData.bid_amount}
                  onChange={(e) => setBidData({ ...bidData, bid_amount: parseInt(e.target.value) || 0 })}
                  className="h-9 text-sm font-semibold"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Estimate: ${lead?.estimated_total?.toLocaleString()}
                {difference > 0 ? (
                  <span className="text-amber-600 ml-2">+{percentDiff}%</span>
                ) : (
                  <span className="text-emerald-600 ml-2">{percentDiff}%</span>
                )}
              </p>
            </div>

            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea
                value={bidData.bid_notes}
                onChange={(e) => setBidData({ ...bidData, bid_notes: e.target.value })}
                placeholder="E.g., 'Premium materials included', 'Includes gutters replacement'"
                className="h-20 text-sm mt-1"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-3.5 h-3.5 mr-1" /> Submit Bid
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <p className="text-xs text-slate-500 mb-1">Current Bid</p>
              <p className="text-2xl font-bold text-slate-900">
                ${bidData.bid_amount?.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                vs estimate: ${lead?.estimated_total?.toLocaleString()}
              </p>
            </div>

            {bidData.bid_notes && (
              <div className="text-xs text-slate-600 bg-white rounded-lg p-2 border border-blue-100">
                <p className="font-semibold mb-1">Notes:</p>
                {bidData.bid_notes}
              </div>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="w-full"
            >
              <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit Bid
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}