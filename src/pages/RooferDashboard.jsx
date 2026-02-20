import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  MapPin, Phone, Mail, DollarSign, Ruler,
  Clock, CheckCircle2, UserCheck, FileText, Loader2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const statusColors = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  contacted: "bg-amber-50 text-amber-700 border-amber-200",
  scheduled: "bg-violet-50 text-violet-700 border-violet-200",
  proposal_sent: "bg-indigo-50 text-indigo-700 border-indigo-200",
  won: "bg-emerald-50 text-emerald-700 border-emerald-200",
  lost: "bg-red-50 text-red-700 border-red-200",
};

export default function RooferDashboard() {
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list("-created_date", 100),
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const handleStatusChange = (lead, newStatus) => {
    updateLeadMutation.mutate({ id: lead.id, data: { status: newStatus } });
    toast.success(`Lead status updated to ${newStatus.replace("_", " ")}`);
  };

  const newLeads = leads.filter((l) => l.status === "new");
  const activeLeads = leads.filter((l) => ["contacted", "scheduled", "proposal_sent"].includes(l.status));
  const closedLeads = leads.filter((l) => ["won", "lost"].includes(l.status));

  const stats = [
    { label: "New Leads", value: newLeads.length, icon: FileText, color: "text-blue-600 bg-blue-50" },
    { label: "Active", value: activeLeads.length, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Won", value: closedLeads.filter((l) => l.status === "won").length, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
    { label: "Revenue", value: `$${closedLeads.filter((l) => l.status === "won").reduce((s, l) => s + (l.estimated_total || 0), 0).toLocaleString()}`, icon: DollarSign, color: "text-violet-600 bg-violet-50" },
  ];

  const LeadCard = ({ lead }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-5">
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
          <Badge className={`${statusColors[lead.status]} border text-xs`}>
            {lead.status?.replace("_", " ")}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-50 rounded-lg p-2 text-center">
            <p className="text-xs text-slate-400">Estimate</p>
            <p className="text-sm font-bold text-slate-800">${lead.estimated_total?.toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-2 text-center">
            <p className="text-xs text-slate-400">Area</p>
            <p className="text-sm font-bold text-slate-800">{lead.roof_area_sqft?.toLocaleString()} ft²</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-2 text-center">
            <p className="text-xs text-slate-400">Material</p>
            <p className="text-xs font-medium text-slate-700">{(lead.material_type || "").replace(/_/g, " ")}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
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
          <Select
            value={lead.status}
            onValueChange={(v) => handleStatusChange(lead, v)}
          >
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
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Roofer Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your leads and track projects</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
          <Tabs defaultValue="new">
            <TabsList className="bg-white border mb-6">
              <TabsTrigger value="new">New ({newLeads.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({activeLeads.length})</TabsTrigger>
              <TabsTrigger value="closed">Closed ({closedLeads.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="new">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {newLeads.map((lead) => <LeadCard key={lead.id} lead={lead} />)}
                {!newLeads.length && (
                  <p className="text-sm text-slate-400 col-span-2 text-center py-12">No new leads yet.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="active">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeLeads.map((lead) => <LeadCard key={lead.id} lead={lead} />)}
                {!activeLeads.length && (
                  <p className="text-sm text-slate-400 col-span-2 text-center py-12">No active leads.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="closed">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {closedLeads.map((lead) => <LeadCard key={lead.id} lead={lead} />)}
                {!closedLeads.length && (
                  <p className="text-sm text-slate-400 col-span-2 text-center py-12">No closed leads.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}