import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MapPin, Home, Hammer, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MilestoneTracker from "@/components/project/MilestoneTracker";
import PaymentPanel from "@/components/project/PaymentPanel";
import ProjectMessaging from "@/components/project/ProjectMessaging";
import { toast } from "sonner";

const statusColors = {
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  materials_ordered: "bg-indigo-50 text-indigo-700 border-indigo-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  inspection: "bg-violet-50 text-violet-700 border-violet-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warranty: "bg-teal-50 text-teal-700 border-teal-200",
};

const rooferStatusFlow = ["scheduled", "materials_ordered", "in_progress", "inspection", "completed"];

export default function ProjectView() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");
  const role = urlParams.get("role") || "homeowner"; // "homeowner" or "roofer"
  const isRoofer = role === "roofer";

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!projectId) return;
    base44.entities.Project.filter({ id: projectId }).then((res) => {
      if (res.length) setProject(res[0]);
      setLoading(false);
    });
  }, [projectId]);

  const save = async (updates) => {
    const updated = { ...project, ...updates };
    await base44.entities.Project.update(projectId, updates);
    setProject(updated);
  };

  const handleUpdateMilestone = async (index, updated) => {
    const milestones = [...(project.milestones || [])];
    milestones[index] = updated;
    await save({ milestones });
    toast.success("Milestone updated!");
  };

  const handleSendMessage = async (msg) => {
    const messages = [...(project.messages || []), msg];
    await save({ messages });
  };

  const handlePayment = async (amount) => {
    const transactions = [...(project.payment_transactions || []), {
      amount,
      description: "Payment",
      date: new Date().toLocaleDateString(),
      status: "completed",
      method: "Credit Card",
    }];
    const amount_paid = (project.amount_paid || 0) + amount;
    await save({ payment_transactions: transactions, amount_paid });
  };

  const handleAdvanceStatus = async () => {
    const idx = rooferStatusFlow.indexOf(project.status);
    if (idx < rooferStatusFlow.length - 1) {
      await save({ status: rooferStatusFlow[idx + 1] });
      toast.success("Project status updated!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400">Project not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(isRoofer ? createPageUrl("RooferDashboard") : createPageUrl("Home"))}
            className="text-slate-300 hover:text-white mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {isRoofer ? <Hammer className="w-4 h-4 text-amber-400" /> : <Home className="w-4 h-4 text-amber-400" />}
                <h1 className="text-xl font-bold text-white">Project Dashboard</h1>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-sm text-slate-300">{project.address}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`${statusColors[project.status]} border text-sm px-3 py-1`}>
                {project.status?.replace(/_/g, " ")}
              </Badge>
              {isRoofer && project.status !== "completed" && (
                <Button
                  size="sm"
                  onClick={handleAdvanceStatus}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  Advance Status →
                </Button>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: "Contract", value: `$${project.contract_amount?.toLocaleString()}` },
              { label: "Paid", value: `$${(project.amount_paid || 0).toLocaleString()}` },
              { label: "Material", value: (project.material_type || "").replace(/_/g, " ") },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-400">{s.label}</p>
                <p className="text-sm font-bold text-white">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="overview">
          <TabsList className="bg-white border mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-5 space-y-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Project Info</p>
                  {[
                    { label: "Address", value: project.address },
                    { label: "Start Date", value: project.start_date || "TBD" },
                    { label: "Est. Completion", value: project.estimated_completion || "TBD" },
                    { label: "Material", value: (project.material_type || "").replace(/_/g, " ") },
                  ].map((r, i) => (
                    <div key={i} className="flex justify-between text-sm py-1 border-b border-slate-50 last:border-0">
                      <span className="text-slate-400">{r.label}</span>
                      <span className="text-slate-800 font-medium">{r.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 space-y-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    {isRoofer ? "Homeowner Contact" : "Your Roofer"}
                  </p>
                  {isRoofer ? [
                    { label: "Name", value: project.homeowner_name },
                    { label: "Phone", value: project.homeowner_phone },
                    { label: "Email", value: project.homeowner_email },
                  ] : [
                    { label: "Company", value: project.roofer_company },
                    { label: "Contact", value: project.roofer_name },
                    { label: "Phone", value: project.roofer_phone },
                  ].map((r, i) => (
                    <div key={i} className="flex justify-between text-sm py-1 border-b border-slate-50 last:border-0">
                      <span className="text-slate-400">{r.label}</span>
                      <span className="text-slate-800 font-medium">{r.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            <MilestoneTracker milestones={project.milestones || []} isRoofer={isRoofer} onUpdateMilestone={handleUpdateMilestone} />
          </TabsContent>

          <TabsContent value="milestones">
            <MilestoneTracker milestones={project.milestones || []} isRoofer={isRoofer} onUpdateMilestone={handleUpdateMilestone} />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentPanel project={project} onPaymentComplete={handlePayment} isRoofer={isRoofer} />
          </TabsContent>

          <TabsContent value="messages">
            <ProjectMessaging
              messages={project.messages || []}
              senderName={isRoofer ? project.roofer_name : project.homeowner_name}
              senderRole={role}
              onSend={handleSendMessage}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}