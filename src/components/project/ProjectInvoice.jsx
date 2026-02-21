import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, CheckCircle2 } from "lucide-react";

export default function ProjectInvoice({ project }) {
  const invoiceNumber = `INV-${project.id?.slice(-6).toUpperCase()}`;
  const invoiceDate = project.actual_completion || project.updated_date?.split("T")[0] || new Date().toLocaleDateString();
  const completedMilestones = (project.milestones || []).filter(m => m.status === "complete" && m.payment_amount > 0);
  const contractAmount = project.contract_amount || 0;
  const amountPaid = project.amount_paid || 0;
  const balance = contractAmount - amountPaid;

  const handleDownload = () => {
    const content = buildInvoiceHTML(project, invoiceNumber, invoiceDate, completedMilestones, contractAmount, amountPaid, balance);
    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoiceNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Invoice header actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-800">Invoice {invoiceNumber}</h2>
          <Badge className={balance <= 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200 border" : "bg-amber-50 text-amber-700 border-amber-200 border"}>
            {balance <= 0 ? "Paid in Full" : "Balance Due"}
          </Badge>
        </div>
        <Button onClick={handleDownload} className="gap-2 bg-slate-800 hover:bg-slate-700">
          <Download className="w-4 h-4" /> Download Invoice
        </Button>
      </div>

      {/* Invoice card */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Parties */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">From</p>
              <p className="font-semibold text-slate-800">{project.roofer_company || "Roofing Contractor"}</p>
              {project.roofer_name && <p className="text-sm text-slate-500">{project.roofer_name}</p>}
              {project.roofer_phone && <p className="text-sm text-slate-500">{project.roofer_phone}</p>}
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Bill To</p>
              <p className="font-semibold text-slate-800">{project.homeowner_name || "Homeowner"}</p>
              {project.homeowner_email && <p className="text-sm text-slate-500">{project.homeowner_email}</p>}
              {project.homeowner_phone && <p className="text-sm text-slate-500">{project.homeowner_phone}</p>}
              <p className="text-sm text-slate-500 mt-1">{project.address}</p>
            </div>
          </div>

          {/* Invoice meta */}
          <div className="flex gap-6 py-3 border-y border-slate-100 text-sm">
            <div><span className="text-slate-400">Invoice #: </span><span className="font-medium">{invoiceNumber}</span></div>
            <div><span className="text-slate-400">Date: </span><span className="font-medium">{invoiceDate}</span></div>
            <div><span className="text-slate-400">Project: </span><span className="font-medium">{project.material_type?.replace(/_/g, " ")} Roof</span></div>
          </div>

          {/* Line items — milestones */}
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">Services Rendered</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left pb-2 text-xs text-slate-400 font-medium">Description</th>
                  <th className="text-right pb-2 text-xs text-slate-400 font-medium">Status</th>
                  <th className="text-right pb-2 text-xs text-slate-400 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {completedMilestones.length > 0 ? (
                  completedMilestones.map((m, i) => (
                    <tr key={i} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 text-slate-700">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          {m.title}
                        </div>
                        {m.description && <p className="text-xs text-slate-400 ml-5">{m.description}</p>}
                      </td>
                      <td className="py-2.5 text-right">
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">Complete</Badge>
                      </td>
                      <td className="py-2.5 text-right font-medium text-slate-800">
                        ${m.payment_amount?.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-400 text-sm">
                      Full roofing project — {project.address}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-slate-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Contract Amount</span>
              <span className="font-medium">${contractAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Amount Paid</span>
              <span className="font-medium text-emerald-600">-${amountPaid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-slate-200 pt-2 mt-2">
              <span className="text-slate-800">Balance Due</span>
              <span className={balance <= 0 ? "text-emerald-600" : "text-slate-900"}>
                {balance <= 0 ? "PAID" : `$${balance.toLocaleString()}`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function buildInvoiceHTML(project, invoiceNumber, invoiceDate, completedMilestones, contractAmount, amountPaid, balance) {
  const milestoneRows = completedMilestones.length > 0
    ? completedMilestones.map(m => `
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;">${m.title}${m.description ? `<br><span style="color:#94a3b8;font-size:12px;">${m.description}</span>` : ""}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;text-align:center;"><span style="background:#ecfdf5;color:#059669;padding:2px 8px;border-radius:4px;font-size:12px;">Complete</span></td>
          <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;">$${m.payment_amount?.toLocaleString()}</td>
        </tr>`).join("")
    : `<tr><td colspan="3" style="padding:16px;text-align:center;color:#94a3b8;">Full roofing project — ${project.address}</td></tr>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>${invoiceNumber}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 40px; color: #1e293b; }
  .invoice { max-width: 760px; margin: 0 auto; background: white; border-radius: 16px; padding: 48px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  h1 { font-size: 28px; font-weight: 800; color: #0f172a; margin: 0 0 4px; }
  .subtitle { color: #64748b; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 600; }
  th:last-child, td:last-child { text-align: right; }
  .total-row td { padding: 8px 0; font-size: 14px; }
  .grand-total td { padding-top: 12px; margin-top: 4px; border-top: 2px solid #e2e8f0; font-weight: 700; font-size: 16px; }
  @media print { body { background: white; padding: 0; } .invoice { box-shadow: none; } }
</style>
</head>
<body>
<div class="invoice">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;">
    <div>
      <h1>INVOICE</h1>
      <p class="subtitle">${invoiceNumber}</p>
    </div>
    <div style="text-align:right;">
      <p style="font-size:13px;color:#64748b;">Date: <strong>${invoiceDate}</strong></p>
      <span style="background:${balance <= 0 ? "#ecfdf5" : "#fffbeb"};color:${balance <= 0 ? "#059669" : "#d97706"};padding:4px 12px;border-radius:6px;font-size:13px;font-weight:600;">
        ${balance <= 0 ? "PAID IN FULL" : "BALANCE DUE"}
      </span>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px;">
    <div>
      <p style="font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;font-weight:600;margin-bottom:8px;">From</p>
      <p style="font-weight:700;margin:0;">${project.roofer_company || "Roofing Contractor"}</p>
      ${project.roofer_name ? `<p style="margin:2px 0;color:#64748b;font-size:14px;">${project.roofer_name}</p>` : ""}
      ${project.roofer_phone ? `<p style="margin:2px 0;color:#64748b;font-size:14px;">${project.roofer_phone}</p>` : ""}
    </div>
    <div>
      <p style="font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;font-weight:600;margin-bottom:8px;">Bill To</p>
      <p style="font-weight:700;margin:0;">${project.homeowner_name || "Homeowner"}</p>
      ${project.homeowner_email ? `<p style="margin:2px 0;color:#64748b;font-size:14px;">${project.homeowner_email}</p>` : ""}
      <p style="margin:2px 0;color:#64748b;font-size:14px;">${project.address}</p>
    </div>
  </div>

  <table style="margin-bottom:24px;">
    <thead><tr><th>Description</th><th style="text-align:center;">Status</th><th style="text-align:right;">Amount</th></tr></thead>
    <tbody>${milestoneRows}</tbody>
  </table>

  <table style="width:300px;margin-left:auto;">
    <tr class="total-row"><td style="color:#64748b;">Contract Amount</td><td>$${contractAmount.toLocaleString()}</td></tr>
    <tr class="total-row"><td style="color:#64748b;">Amount Paid</td><td style="color:#059669;">-$${amountPaid.toLocaleString()}</td></tr>
    <tr class="grand-total"><td>Balance Due</td><td style="color:${balance <= 0 ? "#059669" : "#0f172a"};">${balance <= 0 ? "PAID" : "$" + balance.toLocaleString()}</td></tr>
  </table>

  <p style="margin-top:48px;padding-top:24px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;text-align:center;">
    Thank you for your business — Roofing Marketplace
  </p>
</div>
</body></html>`;
}