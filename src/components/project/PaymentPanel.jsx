import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, DollarSign, CheckCircle2, Loader2, ExternalLink, Lock, Shield, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function PaymentPanel({ project, onPaymentComplete, isRoofer }) {
  const [payAmount, setPayAmount] = useState("");
  const [description, setDescription] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [loadingIdx, setLoadingIdx] = useState(null);
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [paymentType, setPaymentType] = useState(project?.payment_type || "personal");

  const totalPaid = project?.amount_paid || 0;
  const contractAmount = project?.contract_amount || 0;
  const remaining = contractAmount - totalPaid;
  const pctPaid = contractAmount > 0 ? (totalPaid / contractAmount) * 100 : 0;
  const transactions = project?.payment_transactions || [];

  const isInIframe = () => {
    try { return window.self !== window.top; } catch { return true; }
  };

  const openCheckout = async (amount, desc, milestoneIndex = -1) => {
    if (isInIframe()) {
      alert("Checkout is only available from the published app. Please open the app directly.");
      return;
    }

    const baseUrl = `${window.location.origin}${window.location.pathname}?id=${project.id}&role=homeowner&payment=success`;
    const cancelUrl = `${window.location.origin}${window.location.pathname}?id=${project.id}&role=homeowner`;

    try {
      const response = await base44.functions.invoke("createMilestoneCheckout", {
        projectId: project.id,
        milestoneIndex,
        amount,
        description: desc,
        successUrl: baseUrl,
        cancelUrl,
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error(response.data?.error || "No checkout URL returned");
      }
    } catch (err) {
      toast.error("Failed to start checkout: " + err.message);
    }
  };

  const handleMilestonePay = async (milestone, idx) => {
    setLoadingIdx(idx);
    await openCheckout(milestone.payment_amount, milestone.title, idx);
    setLoadingIdx(null);
  };

  const handleCustomPay = async () => {
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (amt > remaining) { toast.error("Amount exceeds remaining balance"); return; }
    setLoadingCustom(true);
    await openCheckout(amt, description || "Project Payment", -1);
    setLoadingCustom(false);
  };

  // Milestones with payment amounts that are still unpaid
  const payableMilestones = (project?.milestones || []).filter(
    (m) => m.payment_amount > 0 && m.payment_status !== "paid"
  );

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <CardTitle className="text-lg font-semibold">Payments</CardTitle>
          </div>
          <Badge className={remaining <= 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200 border" : "bg-amber-50 text-amber-700 border-amber-200 border"}>
            {remaining <= 0 ? "Paid in Full" : `$${remaining.toLocaleString()} Remaining`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Paid: <strong className="text-emerald-600">${totalPaid.toLocaleString()}</strong></span>
            <span>Contract: <strong>${contractAmount.toLocaleString()}</strong></span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(pctPaid, 100)}%` }}
            />
          </div>
          <p className="text-right text-xs text-slate-400 mt-1">{pctPaid.toFixed(0)}% paid</p>
        </div>

        {/* Milestone payments (homeowner only) */}
        {!isRoofer && payableMilestones.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Milestone Payments Due</p>
            {payableMilestones.map((m, originalIdx) => {
              const idx = (project.milestones || []).indexOf(m);
              return (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{m.title}</p>
                    <p className="text-xs text-slate-400">${m.payment_amount?.toLocaleString()}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleMilestonePay(m, idx)}
                    disabled={loadingIdx === idx}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                  >
                    {loadingIdx === idx ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <><CreditCard className="w-3.5 h-3.5" /> Pay</>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Transaction history */}
        {transactions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Transaction History</p>
            {transactions.map((tx, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 px-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-sm text-slate-700">{tx.description}</p>
                    <p className="text-xs text-slate-400">{tx.date} · {tx.method}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-600">+${tx.amount?.toLocaleString()}</p>
                  <Badge className="text-[10px] bg-emerald-50 text-emerald-600 border-0">{tx.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom payment (homeowner only) */}
        {!isRoofer && remaining > 0 && (
          <div>
            {!showCustom ? (
              <Button
                onClick={() => setShowCustom(true)}
                variant="outline"
                className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                <CreditCard className="w-4 h-4 mr-2" /> Make a Custom Payment
              </Button>
            ) : (
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <p className="text-xs font-medium text-emerald-700">Secure Payment via Stripe</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Description</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Deposit, Final payment..."
                    className="h-9 mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Amount ($)</Label>
                  <Input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder={`Up to $${remaining.toLocaleString()}`}
                    className="h-9 mt-1 text-sm"
                    max={remaining}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => setShowCustom(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCustomPay}
                    disabled={loadingCustom}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    {loadingCustom ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <><ExternalLink className="w-3.5 h-3.5" /> Checkout</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {isRoofer && (
          <p className="text-xs text-slate-400 text-center italic">Payments are collected from homeowners via Stripe.</p>
        )}
      </CardContent>
    </Card>
  );
}