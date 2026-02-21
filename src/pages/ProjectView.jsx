import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MapPin, Home, Hammer, Loader2, Edit2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MilestoneTracker from "@/components/project/MilestoneTracker";
import PaymentPanel from "@/components/project/PaymentPanel";
import MessageThread from "@/components/messaging/MessageThread";
import ReviewForm from "@/components/project/ReviewForm";
import MaterialSelector from "@/components/project/MaterialSelector";
import PhotoGallery from "@/components/project/PhotoGallery";
import RoofReport from "@/components/quote/RoofReport";
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
  const [isEditingOverview, setIsEditingOverview] = useState(false);
  const [editData, setEditData] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);

  // Handle Stripe payment success redirect
  useEffect(() => {
    const paymentStatus = urlParams.get("payment");
    const milestoneIdx = urlParams.get("milestone");
    if (paymentStatus === "success" && milestoneIdx !== null) {
      toast.success("Payment successful! Your transaction has been recorded.");
      // Clean up URL params without reload
      const clean = `${window.location.pathname}?id=${projectId}&role=${role}`;
      window.history.replaceState({}, "", clean);
    }
  }, []);

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

  const handleMilestonesChange = async (milestones) => {
    await save({ milestones });
    toast.success("Milestones saved!");
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

  const handleEditOverview = () => {
    setEditData({
      start_date: project.start_date || "",
      estimated_completion: project.estimated_completion || "",
      material_type: project.material_type || "",
    });
    setIsEditingOverview(true);
  };

  const handleSaveOverview = async () => {
    await save(editData);
    setIsEditingOverview(false);
    toast.success("Project details updated!");
  };

  const handleCancelEdit = () => {
    setIsEditingOverview(false);
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
          <TabsList className="bg-white border mb-6 flex-wrap h-auto gap-1 py-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            {!isRoofer && <TabsTrigger value="materials">🏠 Materials</TabsTrigger>}
            <TabsTrigger value="photos">📸 Photos</TabsTrigger>
            {!isRoofer && (project.status === "completed" || project.status === "warranty") && (
              <TabsTrigger value="review">⭐ Review</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-5 space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Project Info</p>
                    {isRoofer && !isEditingOverview && (
                      <Button size="sm" variant="ghost" onClick={handleEditOverview} className="h-7 px-2">
                        <Edit2 className="w-3 h-3 mr-1" /> Edit
                      </Button>
                    )}
                  </div>
                  {isEditingOverview ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs mb-1">Start Date</Label>
                        <Input
                          type="date"
                          value={editData.start_date}
                          onChange={(e) => setEditData({...editData, start_date: e.target.value})}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1">Est. Completion</Label>
                        <Input
                          type="date"
                          value={editData.estimated_completion}
                          onChange={(e) => setEditData({...editData, estimated_completion: e.target.value})}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1">Material Type</Label>
                        <Input
                          value={editData.material_type}
                          onChange={(e) => setEditData({...editData, material_type: e.target.value})}
                          className="text-sm"
                          placeholder="e.g., architectural_shingle"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" onClick={handleSaveOverview} className="bg-green-600 hover:bg-green-700">
                          <Check className="w-3 h-3 mr-1" /> Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          <X className="w-3 h-3 mr-1" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 space-y-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    {isRoofer ? "Homeowner Contact" : "Your Roofer"}
                  </p>
                  {(isRoofer ? [
                    { label: "Name", value: project.homeowner_name },
                    { label: "Phone", value: project.homeowner_phone },
                    { label: "Email", value: project.homeowner_email },
                  ] : [
                    { label: "Company", value: project.roofer_company },
                    { label: "Contact", value: project.roofer_name },
                    { label: "Phone", value: project.roofer_phone },
                  ]).map((r, i) => (
                    <div key={i} className="flex justify-between text-sm py-1 border-b border-slate-50 last:border-0">
                      <span className="text-slate-400">{r.label}</span>
                      <span className="text-slate-800 font-medium">{r.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            <MilestoneTracker milestones={project.milestones || []} isRoofer={isRoofer} onUpdateMilestone={handleUpdateMilestone} project={project} onMilestonesChange={handleMilestonesChange} />
            </TabsContent>

            <TabsContent value="milestones">
              <MilestoneTracker milestones={project.milestones || []} isRoofer={isRoofer} onUpdateMilestone={handleUpdateMilestone} project={project} onMilestonesChange={handleMilestonesChange} />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentPanel project={project} onPaymentComplete={handlePayment} isRoofer={isRoofer} />
          </TabsContent>

          <TabsContent value="messages">
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden" style={{ height: 520 }}>
              {currentUser ? (
                <MessageThread
                  conversationId={`project_${projectId}`}
                  currentUserEmail={currentUser.email}
                  currentUserName={isRoofer ? (project.roofer_name || project.roofer_company) : project.homeowner_name}
                  currentUserRole={role}
                  recipientName={isRoofer ? project.homeowner_name : (project.roofer_name || project.roofer_company)}
                  projectAddress={project.address}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  Please log in to send messages.
                </div>
              )}
            </div>
          </TabsContent>

          {/* Materials tab — homeowner only */}
          {!isRoofer && (
            <TabsContent value="materials">
              <Card>
                <CardContent className="pt-5">
                  <MaterialSelector project={project} onUpdate={(updates) => setProject(prev => ({ ...prev, ...updates }))} />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="photos">
            <PhotoGallery
              project={project}
              isRoofer={isRoofer}
              onUpdate={async (updates) => {
                await save(updates);
              }}
            />
          </TabsContent>

          {/* Review tab — homeowner only, on completed projects */}
          {!isRoofer && (project.status === "completed" || project.status === "warranty") && (
            <TabsContent value="review">
              <ReviewForm project={project} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}