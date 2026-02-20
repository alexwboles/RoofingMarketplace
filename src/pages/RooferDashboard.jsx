import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MapPin, Phone, Mail, DollarSign, Clock,
  CheckCircle2, UserCheck, FileText, Loader2, FolderOpen, ArrowRight, TrendingUp, ChevronDown, ChevronUp,
  Star, Calendar, BarChart2, Percent, Satellite
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import DynamicPricingEngine from "@/components/roofer/DynamicPricingEngine";
import AppointmentManager from "@/components/appointments/AppointmentManager";

function LeadCard({ lead, onStatusChange, onBidUpdate }) {
  const [showPricing, setShowPricing] = useState(false);
  const satelliteUrl = lead.satellite_image_url || `https://maps.google.com/maps?q=${encodeURIComponent(lead.address)}&t=k&z=20`;

  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      {/* Satellite thumbnail */}
      <div className="relative h-32 bg-slate-900 overflow-hidden">
        <iframe
          title="Satellite"
          src={satelliteUrl}
          width="100%"
          height="256"
          style={{ border: 0, pointerEvents: "none", marginTop: "-62px" }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/60" />
        <Badge className={`absolute top-2 right-2 ${leadStatusColors[lead.status]} border text-xs`}>
          {lead.status?.replace("_", " ")}
        </Badge>
      </div>

      <CardContent className="pt-3 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-sm font-semibold text-slate-800">{lead.address}</p>
            </div>
            {lead.homeowner_name && (
              <div className="flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-xs text-slate-500">{lead.homeowner_name}</p>
              </div>
            )}
          </div>
          <a
            href={satelliteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-blue-500 hover:text-blue-700 flex items-center gap-0.5 shrink-0"
          >
            <Satellite className="w-3 h-3" /> View Map
          </a>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-50 rounded-lg p-2 text-center">
            <p className="text-xs text-slate-400">Bid</p>
            <p className="text-sm font-bold text-slate-800">${(lead.roofer_bid || lead.estimated_total)?.toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-2 text-center">
            <p className="text-xs text-slate-400">Area</p>
            <p className="text-sm font-bold text-slate-800">{lead.roof_area_sqft?.toLocaleString()} ft²</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-2 text-center">
            <p className="text-xs text-slate-400">Tier</p>
            <p className="text-xs font-medium text-slate-700 capitalize">{lead.tier || "—"}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            {lead.homeowner_phone && (
              <a href={`tel:${lead.homeowner_phone}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                <Phone className="w-3 h-3" /> Call
              </a>
            )}
            {lead.homeowner_email && (
              <a href={`mailto:${lead.homeowner_email}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                <Mail className="w-3 h-3" /> Email
              </a>
            )}
          </div>
          <Select value={lead.status} onValueChange={(v) => onStatusChange(lead, v)}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-[10px] text-slate-400 mt-3">
          {lead.created_date && format(new Date(lead.created_date), "MMM d, yyyy 'at' h:mm a")}
        </p>

        <button
          onClick={() => setShowPricing(v => !v)}
          className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 rounded-lg py-1.5 transition-colors"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Pricing Engine
          {showPricing ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showPricing && (
          <div className="mt-3">
            <DynamicPricingEngine lead={lead} roofer={null} onBidUpdate={onBidUpdate} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const leadStatusColors = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  contacted: "bg-amber-50 text-amber-700 border-amber-200",
  scheduled: "bg-violet-50 text-violet-700 border-violet-200",
  proposal_sent: "bg-indigo-50 text-indigo-700 border-indigo-200",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  in_progress: "bg-orange-50 text-orange-700 border-orange-200",
  won: "bg-emerald-50 text-emerald-700 border-emerald-200",
  lost: "bg-red-50 text-red-700 border-red-200",
};

const projectStatusColors = {
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  materials_ordered: "bg-indigo-50 text-indigo-700 border-indigo-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  inspection: "bg-violet-50 text-violet-700 border-violet-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warranty: "bg-teal-50 text-teal-700 border-teal-200",
};

export default function RooferDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list("-created_date", 100),
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list("-created_date", 100),
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const handleStatusChange = (lead, newStatus) => {
    updateLeadMutation.mutate({ id: lead.id, data: { status: newStatus } });
    toast.success(`Lead updated to ${newStatus.replace("_", " ")}`);
  };

  const newLeads = leads.filter((l) => l.status === "new");
  const activeLeads = leads.filter((l) => ["contacted", "scheduled", "proposal_sent"].includes(l.status));
  const activeProjects = projects.filter((p) => !["completed", "warranty"].includes(p.status));
  const completedProjects = projects.filter((p) => ["completed", "warranty"].includes(p.status));

  const totalRevenue = completedProjects.reduce((s, p) => s + (p.contract_amount || 0), 0);
  const wonLeads = leads.filter(l => ["won", "accepted"].includes(l.status)).length;
  const conversionRate = leads.length > 0 ? Math.round((wonLeads / leads.length) * 100) : 0;

  const stats = [
    { label: "New Leads", value: newLeads.length, icon: FileText, color: "text-blue-600 bg-blue-50" },
    { label: "Active Projects", value: activeProjects.length, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Completed", value: completedProjects.length, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
    { label: "Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-violet-600 bg-violet-50" },
    { label: "Conversion", value: `${conversionRate}%`, icon: Percent, color: "text-rose-600 bg-rose-50" },
    { label: "Leads Won", value: wonLeads, icon: TrendingUp, color: "text-teal-600 bg-teal-50" },
  ];



  const ProjectCard = ({ project }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl("ProjectView") + `?id=${project.id}&role=roofer`)}>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-sm font-semibold text-slate-800">{project.address}</p>
            </div>
            <p className="text-xs text-slate-500">{project.homeowner_name}</p>
          </div>
          <Badge className={`${projectStatusColors[project.status]} border text-xs`}>
            {project.status?.replace(/_/g, " ")}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-50 rounded-lg p-2 text-center">
            <p className="text-xs text-slate-400">Contract</p>
            <p className="text-sm font-bold text-slate-800">${project.contract_amount?.toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-2 text-center">
            <p className="text-xs text-slate-400">Paid</p>
            <p className="text-sm font-bold text-emerald-600">${(project.amount_paid || 0).toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-2 text-center">
            <p className="text-xs text-slate-400">Remaining</p>
            <p className="text-sm font-bold text-slate-800">${((project.contract_amount || 0) - (project.amount_paid || 0)).toLocaleString()}</p>
          </div>
        </div>

        <Button size="sm" variant="outline" className="w-full text-xs h-8">
          <FolderOpen className="w-3.5 h-3.5 mr-1.5" /> Open Project <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );

  const isLoading = leadsLoading || projectsLoading;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Roofer Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Manage leads and active projects</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {stats.map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className="text-xl font-bold text-slate-900">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
          </div>
        ) : (
          <Tabs defaultValue="projects">
            <TabsList className="bg-white border mb-6 flex-wrap h-auto gap-1 py-1">
              <TabsTrigger value="projects">Active Projects ({activeProjects.length})</TabsTrigger>
              <TabsTrigger value="new_leads">New Leads ({newLeads.length})</TabsTrigger>
              <TabsTrigger value="leads">All Leads ({leads.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedProjects.length})</TabsTrigger>
              <TabsTrigger value="appointments"><Calendar className="w-3.5 h-3.5 mr-1" /> Appointments</TabsTrigger>
              <TabsTrigger value="analytics"><BarChart2 className="w-3.5 h-3.5 mr-1" /> Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="projects">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeProjects.map((p) => <ProjectCard key={p.id} project={p} />)}
                {!activeProjects.length && <p className="text-sm text-slate-400 col-span-2 text-center py-12">No active projects yet.</p>}
              </div>
            </TabsContent>

            <TabsContent value="new_leads">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {newLeads.map((lead) => <LeadCard key={lead.id} lead={lead} onStatusChange={handleStatusChange} onBidUpdate={() => queryClient.invalidateQueries({ queryKey: ["leads"] })} />)}
                {!newLeads.length && <p className="text-sm text-slate-400 col-span-2 text-center py-12">No new leads yet.</p>}
              </div>
            </TabsContent>

            <TabsContent value="leads">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {leads.map((lead) => <LeadCard key={lead.id} lead={lead} onStatusChange={handleStatusChange} onBidUpdate={() => queryClient.invalidateQueries({ queryKey: ["leads"] })} />)}
                {!leads.length && <p className="text-sm text-slate-400 col-span-2 text-center py-12">No leads yet.</p>}
              </div>
            </TabsContent>

            <TabsContent value="completed">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedProjects.map((p) => <ProjectCard key={p.id} project={p} />)}
                {!completedProjects.length && <p className="text-sm text-slate-400 col-span-2 text-center py-12">No completed projects yet.</p>}
              </div>
            </TabsContent>

            <TabsContent value="appointments">
              <AppointmentManager rooferId="dashboard" rooferCompany="My Company" />
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Lead Pipeline</p>
                  <div className="space-y-3">
                    {[
                      { label: "New", count: newLeads.length, color: "bg-blue-400" },
                      { label: "Active", count: activeLeads.length, color: "bg-amber-400" },
                      { label: "Won", count: wonLeads, color: "bg-emerald-400" },
                      { label: "Lost", count: leads.filter(l => l.status === "lost").length, color: "bg-red-300" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 w-14">{item.label}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className={`h-full rounded-full ${item.color}`} style={{ width: leads.length ? `${(item.count / leads.length) * 100}%` : "0%" }} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 w-6 text-right">{item.count}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-sm">
                    <span className="text-slate-400">Conversion Rate</span>
                    <span className="font-bold text-slate-800">{conversionRate}%</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Revenue Summary</p>
                  <div className="space-y-3">
                    {[
                      { label: "Total Contracted", value: `$${leads.reduce((s, l) => s + (l.roofer_bid || l.estimated_total || 0), 0).toLocaleString()}` },
                      { label: "Won Revenue", value: `$${totalRevenue.toLocaleString()}` },
                      { label: "Avg Project Size", value: completedProjects.length ? `$${Math.round(totalRevenue / completedProjects.length).toLocaleString()}` : "—" },
                    ].map((r) => (
                      <div key={r.label} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                        <span className="text-sm text-slate-500">{r.label}</span>
                        <span className="text-sm font-bold text-slate-800">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 md:col-span-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Project Status Breakdown</p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {["scheduled","materials_ordered","in_progress","inspection","completed","warranty"].map(status => {
                      const count = projects.filter(p => p.status === status).length;
                      return (
                        <div key={status} className="text-center bg-slate-50 rounded-xl p-3">
                          <p className="text-xl font-bold text-slate-800">{count}</p>
                          <p className="text-[10px] text-slate-400 capitalize mt-0.5">{status.replace(/_/g, " ")}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}