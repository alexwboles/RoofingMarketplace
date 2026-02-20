import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Clock, Circle, ChevronRight, DollarSign,
  Loader2, CreditCard, Plus, Pencil, Trash2, Save, X, CalendarDays
} from "lucide-react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const statusIcon = {
  complete: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
  in_progress: <Clock className="w-5 h-5 text-amber-500 animate-pulse" />,
  pending: <Circle className="w-5 h-5 text-slate-300" />,
};

const statusStyles = {
  complete: "bg-emerald-50 border-emerald-100",
  in_progress: "bg-amber-50 border-amber-100",
  pending: "bg-slate-50 border-slate-100",
};

function MilestoneForm({ milestone, onSave, onCancel }) {
  const [form, setForm] = useState(
    milestone || { title: "", description: "", payment_amount: 0, status: "pending", payment_status: "unpaid" }
  );
  return (
    <div className="border border-slate-200 rounded-xl p-3 space-y-2 bg-white">
      <Input
        placeholder="Milestone title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="h-8 text-sm"
      />
      <Input
        placeholder="Description (optional)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="h-8 text-sm"
      />
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 shrink-0">Payment ($)</span>
        <Input
          type="number"
          placeholder="0"
          value={form.payment_amount || ""}
          onChange={(e) => setForm({ ...form, payment_amount: parseFloat(e.target.value) || 0 })}
          className="h-8 text-sm w-28"
          min={0}
        />
        <div className="flex gap-1 ml-auto">
          <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 px-2"><X className="w-3.5 h-3.5" /></Button>
          <Button size="sm" onClick={() => onSave(form)} className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
            <Save className="w-3.5 h-3.5 mr-1" /> Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MilestoneTracker({ milestones = [], isRoofer, onUpdateMilestone, project, onMilestonesChange }) {
  const completed = milestones.filter((m) => m.status === "complete").length;
  const [checkingOut, setCheckingOut] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const [addingNew, setAddingNew] = useState(false);

  const handleMarkComplete = async (i, milestone) => {
    await onUpdateMilestone(i, { ...milestone, status: "complete", completed_date: new Date().toLocaleDateString() });
    if (milestone.payment_amount > 0 && project?.homeowner_email) {
      toast.info(`Milestone complete! Payment of $${milestone.payment_amount.toLocaleString()} is now due.`);
    }
  };

  const handlePayMilestone = async (i, milestone) => {
    if (window.self !== window.top) {
      alert("Stripe checkout only works from the published app. Please open the app in a new tab.");
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
      successUrl: `${currentUrl}?id=${projectId}&role=homeowner&payment=success&milestone=${i}`,
      cancelUrl: `${currentUrl}?id=${projectId}&role=homeowner`,
    });
    setCheckingOut(null);
    if (response.data?.url) {
      window.location.href = response.data.url;
    } else {
      toast.error("Could not initiate payment. Please try again.");
    }
  };

  const handleSaveEdit = async (i, form) => {
    const updated = milestones.map((m, idx) => (idx === i ? { ...m, ...form } : m));
    onMilestonesChange && onMilestonesChange(updated);
    setEditingIdx(null);
  };

  const handleAddNew = async (form) => {
    const updated = [...milestones, form];
    onMilestonesChange && onMilestonesChange(updated);
    setAddingNew(false);
  };

  const handleDelete = (i) => {
    const updated = milestones.filter((_, idx) => idx !== i);
    onMilestonesChange && onMilestonesChange(updated);
  };

  const totalPayments = milestones.reduce((s, m) => s + (m.payment_amount || 0), 0);
  const paidPayments = milestones.filter(m => m.payment_status === "paid").reduce((s, m) => s + (m.payment_amount || 0), 0);

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <CardTitle className="text-lg font-semibold">Project Milestones</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{completed}/{milestones.length} complete</span>
            {isRoofer && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAddingNew(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            )}
          </div>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-700"
            style={{ width: milestones.length > 0 ? `${(completed / milestones.length) * 100}%` : "0%" }}
          />
        </div>
        {totalPayments > 0 && (
          <div className="flex justify-between text-xs text-slate-400 mt-1.5">
            <span>Milestone payments: <strong className="text-slate-600">${totalPayments.toLocaleString()}</strong></span>
            <span className="text-emerald-600 font-medium">${paidPayments.toLocaleString()} paid</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {milestones.map((milestone, i) => (
            editingIdx === i ? (
              <MilestoneForm
                key={i}
                milestone={milestone}
                onSave={(form) => handleSaveEdit(i, form)}
                onCancel={() => setEditingIdx(null)}
              />
            ) : (
              <div
                key={i}
                className={cn("flex items-start gap-3 p-3 rounded-xl border transition-colors", statusStyles[milestone.status] || statusStyles.pending)}
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
                        <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" /> {milestone.completed_date}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {milestone.payment_amount > 0 && (
                        <div className="flex items-center gap-1 text-xs font-medium text-slate-600 mr-1">
                          <DollarSign className="w-3 h-3" />
                          {milestone.payment_amount?.toLocaleString()}
                          {milestone.payment_status === "paid"
                            ? <Badge className="text-[10px] bg-emerald-50 text-emerald-600 border-0">Paid</Badge>
                            : milestone.status === "complete"
                              ? <Badge className="text-[10px] bg-amber-50 text-amber-600 border-amber-200 border">Due</Badge>
                              : null
                          }
                        </div>
                      )}
                      {isRoofer && (
                        <>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600" onClick={() => setEditingIdx(i)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => handleDelete(i)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Roofer actions */}
                  {isRoofer && milestone.status !== "complete" && (
                    <div className="flex gap-2 mt-2">
                      {milestone.status === "pending" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs"
                          onClick={() => onUpdateMilestone(i, { ...milestone, status: "in_progress" })}>
                          Start
                        </Button>
                      )}
                      {milestone.status === "in_progress" && (
                        <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleMarkComplete(i, milestone)}>
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Homeowner pay button */}
                  {!isRoofer && milestone.status === "complete" && milestone.payment_amount > 0 && milestone.payment_status !== "paid" && (
                    <Button
                      size="sm"
                      className="mt-2 h-7 text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                      onClick={() => handlePayMilestone(i, milestone)}
                      disabled={checkingOut === i}
                    >
                      {checkingOut === i ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CreditCard className="w-3 h-3 mr-1" />}
                      Pay ${milestone.payment_amount?.toLocaleString()}
                    </Button>
                  )}
                </div>
              </div>
            )
          ))}

          {addingNew && (
            <MilestoneForm
              onSave={handleAddNew}
              onCancel={() => setAddingNew(false)}
            />
          )}

          {milestones.length === 0 && !addingNew && (
            <p className="text-sm text-slate-400 text-center py-4 italic">No milestones set yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}