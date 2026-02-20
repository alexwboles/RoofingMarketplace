import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, BarChart3 } from "lucide-react";
import { createPageUrl } from "@/utils";
import BidCustomForm from "@/components/bids/BidCustomForm";
import BidAutoGenerate from "@/components/bids/BidAutoGenerate";

export default function BidSubmission() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get("leadId");
  const [selectedOption, setSelectedOption] = useState(null);

  const { data: lead, isLoading } = useQuery({
    queryKey: ["lead", leadId],
    queryFn: () => base44.entities.Lead.filter({ id: leadId }),
    enabled: !!leadId,
  });

  const leadData = lead?.[0];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!leadData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600 mb-4">Lead not found</p>
            <Button onClick={() => navigate(createPageUrl("RooferDashboard"))}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(createPageUrl("RooferDashboard"))}
          className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Submit Bid</h1>
          <p className="text-sm text-slate-500 mt-1">{leadData.address}</p>
        </div>

        {/* Selection phase */}
        {!selectedOption ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Custom Bid Option */}
            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-slate-200 hover:border-violet-400"
              onClick={() => setSelectedOption("custom")}
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-violet-600" />
                  </div>
                  <CardTitle className="text-lg">Custom Bid</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  Submit a custom bid with your own pricing, materials, and labor costs.
                </p>
                <div className="space-y-2 mb-4">
                  <div className="text-xs text-slate-500">
                    <p className="font-semibold mb-1">You can customize:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Total bid amount</li>
                      <li>Materials cost</li>
                      <li>Labor cost</li>
                      <li>Notes and special details</li>
                    </ul>
                  </div>
                </div>
                <Button className="w-full bg-violet-600 hover:bg-violet-700">
                  Enter Custom Bid
                </Button>
              </CardContent>
            </Card>

            {/* Auto-Generate Option */}
            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-slate-200 hover:border-emerald-400"
              onClick={() => setSelectedOption("auto")}
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <CardTitle className="text-lg">Auto-Generate Bid</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  AI-powered bid generation based on your previous quotes or completed jobs.
                </p>
                <div className="space-y-2 mb-4">
                  <div className="text-xs text-slate-500">
                    <p className="font-semibold mb-1">Uses:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Your previous quotes</li>
                      <li>Completed project data</li>
                      <li>Market analysis</li>
                      <li>Your profit margins</li>
                    </ul>
                  </div>
                </div>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Auto-Generate Bid
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : selectedOption === "custom" ? (
          <BidCustomForm
            lead={leadData}
            onBack={() => setSelectedOption(null)}
            onSuccess={() => navigate(createPageUrl("RooferDashboard"))}
          />
        ) : (
          <BidAutoGenerate
            lead={leadData}
            onBack={() => setSelectedOption(null)}
            onSuccess={() => navigate(createPageUrl("RooferDashboard"))}
          />
        )}
      </div>
    </div>
  );
}