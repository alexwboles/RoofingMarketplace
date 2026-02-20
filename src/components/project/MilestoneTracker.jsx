import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Circle, ChevronRight, DollarSign, Loader2, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const statusIcon = {
  complete: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
  in_progress: <Clock className="w-5 h-5 text-amber-500 animate-pulse" />,
  pending: <Circle className="w-5 h-5 text-slate-300" />,
};

export default function MilestoneTracker({ milestones = [], isRoofer, onUpdateMilestone, project }) {
  const completed = milestones.filter((m) => m.status === "complete").length;
  const [checkingOut, setCheckingOut] = useState(null);

  const handleMarkComplete = async (i, milestone) => {
    await onUpdateMilestone(i, { ...milestone, status: "complete", completed_date: new Date().toLocaleDateString() });

    // If milestone has a payment amount and homeowner, trigger Stripe checkout prompt
    if (milestone.payment_amount > 0 && project?.homeowner_email) {
      toast.info(`Milestone complete! A payment request of $${milestone.payment_amount.toLocaleString()} has been triggered for the homeowner.`);
    }
  };

  const handlePayMilestone = async (i, milestone) => {
    // Check if running in iframe (preview) - block checkout
    if (window.self !== window.top) {
      alert("Stripe checkout only works from the published app. Please open the app in a new tab to make payments.");
      return;
    }

    setCheckingOut(i);
    const currentUrl = window.location.href.split("?")[0];
    const projectId = project?.id;

    const response = await base44.functions.invoke("createMilestoneCheckout", {
      projectId,
      milestoneIndex: i,
      amount: milestone.payment_amount,
      description: milestone.title,
      successUrl: `${currentUrl}?id=${projectId}&role=homeowner&payment=success`,
      cancelUrl: `${currentUrl}?id=${projectId}&role=homeowner`,
    });

    setCheckingOut(null);

    if (response.data?.url) {
      window.location.href = response.data.url;
    } else {
      toast.error("Could not initiate payment. Please try again.");
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <CardTitle className="text-lg font-semibold">Project Milestones</CardTitle>
          </div>
          <span className="text-xs text-slate-400">{completed}/{milestones.length} complete</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-700"
            style={{ width: milestones.length > 0 ? `${(completed / milestones.length) * 100}%` : "0%" }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {milestones.map((milestone, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl border transition-colors",
                milestone.status === "complete" ? "bg-emerald-50 border-emerald-100" :
                milestone.status === "in_progress" ? "bg-amber-50 border-amber-100" :
                "bg-slate-50 border-slate-100"
              )}
            >
              <div className="shrink-0 mt-0.5">{statusIcon[milestone.status] || statusIcon.pending}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={cn("text-sm font-semibold", milestone.status === "complete" ? "text-emerald-800" : "text-slate-800")}>
                      {milestone.title}
                    </p>
                    {milestone.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{milestone.description}</p>
                    )}
                    {milestone.completed_date && (
                      <p className="text-xs text-emerald-600 mt-1">Completed: {milestone.completed_date}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {milestone.payment_amount > 0 && (
                      <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
                        <DollarSign className="w-3 h-3" />
                        {milestone.payment_amount?.toLocaleString()}
                        {milestone.payment_status === "paid"
                          ? <Badge className="text-[10px] bg-emerald-50 text-emerald-600 border-0 ml-1">Paid</Badge>
                          : milestone.status === "complete"
                            ? <Badge className="text-[10px] bg-amber-50 text-amber-600 border-amber-200 border ml-1">Due</Badge>
                            : null
                        }
                      </div>
                    )}
                  </div>
                </div>

                {/* Roofer actions */}
                {isRoofer && milestone.status !== "complete" && (
                  <div className="flex gap-2 mt-2">
                    {milestone.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => onUpdateMilestone(i, { ...milestone, status: "in_progress" })}
                      >
                        Start
                      </Button>
                    )}
                    {milestone.status === "in_progress" && (
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleMarkComplete(i, milestone)}
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                )}

                {/* Homeowner pay button — shown when milestone is complete and payment is unpaid */}
                {!isRoofer && milestone.status === "complete" && milestone.payment_amount > 0 && milestone.payment_status !== "paid" && (
                  <Button
                    size="sm"
                    className="mt-2 h-7 text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                    onClick={() => handlePayMilestone(i, milestone)}
                    disabled={checkingOut === i}
                  >
                    {checkingOut === i
                      ? <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      : <CreditCard className="w-3 h-3 mr-1" />
                    }
                    Pay ${milestone.payment_amount?.toLocaleString()}
                  </Button>
                )}
              </div>
            </div>
          ))}
          {milestones.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4 italic">No milestones set yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}