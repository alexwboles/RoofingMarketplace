import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Circle, ChevronRight, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const statusIcon = {
  complete: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
  in_progress: <Clock className="w-5 h-5 text-amber-500 animate-pulse" />,
  pending: <Circle className="w-5 h-5 text-slate-300" />,
};

export default function MilestoneTracker({ milestones = [], isRoofer, onUpdateMilestone }) {
  const completed = milestones.filter((m) => m.status === "complete").length;

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
        {/* Progress bar */}
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
                        {milestone.payment_status === "paid" && (
                          <Badge className="text-[10px] bg-emerald-50 text-emerald-600 border-0 ml-1">Paid</Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
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
                        onClick={() => onUpdateMilestone(i, { ...milestone, status: "complete", completed_date: new Date().toLocaleDateString() })}
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
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