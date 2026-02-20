import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, DollarSign, CheckCircle2, Clock, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

export default function PaymentPanel({ project, onPaymentComplete, isRoofer }) {
  const [payAmount, setPayAmount] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [paying, setPaying] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const totalPaid = project?.amount_paid || 0;
  const contractAmount = project?.contract_amount || 0;
  const remaining = contractAmount - totalPaid;
  const pctPaid = contractAmount > 0 ? (totalPaid / contractAmount) * 100 : 0;

  const handlePay = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }
    if (parseFloat(payAmount) > remaining) {
      toast.error("Amount exceeds remaining balance");
      return;
    }
    setPaying(true);
    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 2000));
    setPaying(false);
    setShowForm(false);
    setPayAmount("");
    setCardNum("");
    setExpiry("");
    setCvv("");
    toast.success(`Payment of $${parseFloat(payAmount).toLocaleString()} processed!`);
    onPaymentComplete(parseFloat(payAmount));
  };

  const transactions = project?.payment_transactions || [];

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
      <CardContent className="space-y-4">
        {/* Progress */}
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

        {/* Transaction history */}
        {transactions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Transaction History</p>
            {transactions.map((tx, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm text-slate-700">{tx.description}</p>
                  <p className="text-xs text-slate-400">{tx.date} · {tx.method}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-600">+${tx.amount?.toLocaleString()}</p>
                  <Badge className="text-[10px] bg-emerald-50 text-emerald-600 border-0">{tx.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payment form - only for homeowners */}
        {!isRoofer && remaining > 0 && (
          <>
            {!showForm ? (
              <Button
                onClick={() => setShowForm(true)}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Make a Payment
              </Button>
            ) : (
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <p className="text-xs font-medium text-emerald-700">Secure Payment</p>
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

                <div>
                  <Label className="text-xs text-slate-500">Card Number</Label>
                  <Input
                    value={cardNum}
                    onChange={(e) => setCardNum(e.target.value.replace(/\D/g, "").slice(0, 16))}
                    placeholder="4242 4242 4242 4242"
                    className="h-9 mt-1 text-sm font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-500">Expiry</Label>
                    <Input
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="h-9 mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">CVV</Label>
                    <Input
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123"
                      className="h-9 mt-1 text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePay}
                    disabled={paying}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pay $${payAmount || "0"}`}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}