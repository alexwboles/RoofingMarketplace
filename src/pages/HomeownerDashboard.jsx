import React from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Calendar, User, MessageSquare, FileText, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function HomeownerDashboard() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["myProjects"],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Project.filter({ homeowner_email: user.email }, "-created_date", 50);
    },
    enabled: !!user?.email,
  });

  const activeProjects = projects.filter(p => !['completed', 'warranty'].includes(p.status));
  const completedProjects = projects.filter(p => ['completed', 'warranty'].includes(p.status));

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600 mb-4">Please log in to view your projects.</p>
            <Button onClick={() => base44.auth.redirectToLogin()} className="w-full">
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    { label: "Active Projects", value: activeProjects.length, color: "text-amber-600 bg-amber-50" },
    { label: "Completed", value: completedProjects.length, color: "text-emerald-600 bg-emerald-50" },
    { label: "Total Investment", value: `$${projects.reduce((s, p) => s + (p.contract_amount || 0), 0).toLocaleString()}`, color: "text-violet-600 bg-violet-50" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">My Roofing Projects</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track your roof projects</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  {i === 0 && <Calendar className="w-5 h-5" />}
                  {i === 1 && <FileText className="w-5 h-5" />}
                  {i === 2 && <DollarSign className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className="text-lg font-bold text-slate-900">{s.value}</p>
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
          <div className="space-y-6">
            {activeProjects.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Active Projects</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeProjects.map((project) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl("ProjectView") + `?id=${project.id}&role=homeowner`)}>
                      <CardContent className="pt-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <p className="text-sm font-semibold text-slate-800">{project.address}</p>
                            </div>
                            <p className="text-xs text-slate-500">{project.roofer_company}</p>
                          </div>
                          <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs capitalize">
                            {project.status?.replace(/_/g, " ")}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-slate-400">Contract</p>
                            <p className="text-sm font-bold text-slate-800">${project.contract_amount?.toLocaleString()}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-slate-400">Paid</p>
                            <p className="text-sm font-bold text-emerald-600">${(project.amount_paid || 0).toLocaleString()}</p>
                          </div>
                        </div>

                        <Button size="sm" variant="outline" className="w-full text-xs h-8">
                          View Project
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {completedProjects.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Completed Projects</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedProjects.map((project) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl("ProjectView") + `?id=${project.id}&role=homeowner`)}>
                      <CardContent className="pt-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <p className="text-sm font-semibold text-slate-800">{project.address}</p>
                            </div>
                            <p className="text-xs text-slate-500">{project.roofer_company}</p>
                          </div>
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">Completed</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-slate-400">Total Cost</p>
                            <p className="text-sm font-bold text-slate-800">${project.contract_amount?.toLocaleString()}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-slate-400">Completed</p>
                            <p className="text-sm font-bold text-slate-800">{project.actual_completion ? format(new Date(project.actual_completion), 'MMM d') : '—'}</p>
                          </div>
                        </div>

                        <Button size="sm" variant="outline" className="w-full text-xs h-8">
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {projects.length === 0 && (
              <Card className="text-center py-16">
                <CardContent>
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 mb-4">No projects yet. Start by getting a roof quote!</p>
                  <Button onClick={() => navigate(createPageUrl("Home"))}>
                    Get a Quote
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}