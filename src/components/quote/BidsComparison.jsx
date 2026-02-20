import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Star, MapPin, Phone, Award, Loader2 } from "lucide-react";

export default function BidsComparison({ quoteId, onSelectBid }) {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBidId, setSelectedBidId] = useState(null);

  useEffect(() => {
    const loadBids = async () => {
      const allBids = await base44.entities.RooferBid.filter({ quote_id: quoteId });
      const submittedBids = allBids.filter(b => ["submitted", "accepted"].includes(b.status));
      setBids(submittedBids);
      setLoading(false);
    };
    loadBids();
  }, [quoteId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
      </div>
    );
  }

  if (bids.length === 0) {
    return null;
  }

  // Sort by price
  const sortedBids = [...bids].sort((a, b) => a.bid_amount - b.bid_amount);
  const minBid = sortedBids[0]?.bid_amount;
  const maxBid = sortedBids[sortedBids.length - 1]?.bid_amount;
  const bidRange = maxBid - minBid;

  const getBidTier = (amount) => {
    if (Math.abs(amount - minBid) < 50) return "best-price";
    if (bidRange > 0 && amount - minBid < bidRange * 0.33) return "good-price";
    return "standard";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-slate-900">Compare Bids ({bids.length})</h3>
      </div>

      {sortedBids.map((bid) => {
        const tierBadge = getBidTier(bid.bid_amount);
        const isSelected = selectedBidId === bid.id;

        return (
          <Card
            key={bid.id}
            className={`cursor-pointer transition-all ${
              isSelected ? "ring-2 ring-emerald-500 border-emerald-200" : "hover:border-slate-300"
            }`}
            onClick={() => setSelectedBidId(bid.id)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div>
                      <h4 className="font-semibold text-slate-900">{bid.roofer_company}</h4>
                      <p className="text-xs text-slate-500">{bid.roofer_name}</p>
                    </div>
                    {tierBadge === "best-price" && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                        Best Price
                      </Badge>
                    )}
                    {tierBadge === "good-price" && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        Good Value
                      </Badge>
                    )}
                  </div>

                  {/* Rating & Contact */}
                  <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < Math.round(bid.roofer_rating || 0)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-600">
                        {bid.roofer_rating?.toFixed(1)} ({bid.roofer_reviews} reviews)
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600">
                      <Phone className="w-3.5 h-3.5" />
                      <span className="text-xs">{bid.roofer_phone}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {bid.bid_notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 rounded p-2 mb-3">
                      {bid.bid_notes}
                    </p>
                  )}

                  {/* Cost Breakdown */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {bid.materials_cost > 0 && (
                      <div>
                        <p className="text-xs text-slate-500">Materials</p>
                        <p className="font-semibold text-slate-900">
                          ${bid.materials_cost?.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {bid.labor_cost > 0 && (
                      <div>
                        <p className="text-xs text-slate-500">Labor</p>
                        <p className="font-semibold text-slate-900">
                          ${bid.labor_cost?.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bid Amount & Action */}
                <div className="flex flex-col items-end gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-3xl font-bold text-slate-900">
                      ${bid.bid_amount?.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Estimate: ${bid.estimated_total?.toLocaleString()}
                    </p>
                  </div>

                  {isSelected ? (
                    <Button
                      onClick={() => onSelectBid?.(bid)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Select
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full">
                      Choose
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}