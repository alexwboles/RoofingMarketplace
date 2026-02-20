import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowRight, Home, FileText, CheckCircle2, Clock, DollarSign, MapPin, Loader2, Plus } from "lucide-react";

const quoteStatusColors = {
  analyzing: "bg-blue-50 text-blue-700 border-blue-200",
  quoted: "bg-amber-50 text-amber-700 border-amber-200",
  lead_sent: "bg-violet-50 text-violet-700 border-violet-200",
  claimed: "bg-green-50 text-green-700 border-green-200",
  in_progress: "bg-indigo-50 text-indigo-700 border-indigo-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const projectStatusColors = {
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  materials_ordered: "bg-indigo-50 text-indigo-700 border-indigo-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  inspection: "bg-violet-50 text-violet-700 border-violet-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warranty: "bg-teal-50 text-teal-700 border-teal-200",
};

export default function HomeownerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // Since this is public app, we won't use auth. Just show recent quotes/projects
      const allQuotes = await base44.entities.RoofQuote.list("-created_date", 100);
      const allProjects = await base44.entities.Project.list("-created_date", 100);
      setQuotes(allQuotes);
      setProjects(allProjects);
      setLoading(false);
    };
    loadData();
  }, []);

  const activeProjects = projects.filter(p => !["completed", "warranty"].includes(p.status));
  const pastProjects = projects.filter(p => ["completed", "warranty"].includes(p.status));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">My Roofing Dashboard</h1>
              <p className="text-slate-300 text-sm">Track your quotes, active projects, and completed work</p>
            </div>
            <Button
              onClick={() => navigate(createPageUrl("Home"))}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" /> New Quote
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="quotes">
          <TabsList className="bg-white border mb-6 flex-wrap h-auto gap-1 py-1">
            <TabsTrigger value="quotes">
              <FileText className="w-4 h-4 mr-2" />
              Quotes ({quotes.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              <Clock className="w-4 h-4 mr-2" />
              Active Projects ({activeProjects.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Completed ({pastProjects.length})
            </TabsTrigger>
          </TabsList>

          {/* QUOTES TAB */}
          <TabsContent value="quotes" className="space-y-4">
            {quotes.length === 0 ? (
              <Card>
                <CardContent className="pt-10 text-center">
                  <p className="text-slate-500 mb-4">No quotes yet. Get started with a new estimate.</p>
                  <Button
                    onClick={() => navigate(createPageUrl("Home"))}
                    className="bg-amber-500 hover:bg-amber-600"
                  >
                    Create Your First Quote
                  </Button>
                </CardContent>
              </Card>
            ) : (
              quotes.map((quote) => (
                <Card key={quote.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">{quote.address}</h3>
                          <Badge
                            className={`${quoteStatusColors[quote.status]} border`}
                          >
                            {quote.status?.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                          <div>
                            <p className="text-slate-400 text-xs">Roof Area</p>
                            <p className="font-semibold text-slate-900">
                              {quote.roof_analysis?.total_area_sqft?.toLocaleString() || "—"} ft²
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs">Estimated Total</p>
                            <p className="font-semibold text-slate-900">
                              ${quote.estimated_total?.toLocaleString() || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs">Material</p>
                            <p className="font-semibold text-slate-900">
                              {(quote.material_type || "").replace(/_/g, " ")}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => navigate(createPageUrl("QuoteResult") + `?id=${quote.id}`)}
                      >
                        View <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* ACTIVE PROJECTS TAB */}
          <TabsContent value="active" className="space-y-4">
            {activeProjects.length === 0 ? (
              <Card>
                <CardContent className="pt-10 text-center">
                  <p className="text-slate-500">No active projects</p>
                </CardContent>
              </Card>
            ) : (
              activeProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">{project.address}</h3>
                          <Badge
                            className={`${projectStatusColors[project.status]} border`}
                          >
                            {project.status?.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                          <div>
                            <p className="text-slate-400 text-xs">Roofer</p>
                            <p className="font-semibold text-slate-900">{project.roofer_company}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs">Contract Amount</p>
                            <p className="font-semibold text-slate-900">
                              ${project.contract_amount?.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs">Paid</p>
                            <p className="font-semibold text-emerald-600">
                              ${(project.amount_paid || 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs">Est. Completion</p>
                            <p className="font-semibold text-slate-900">
                              {project.estimated_completion || "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => navigate(createPageUrl("ProjectView") + `?id=${project.id}&role=homeowner`)}
                      >
                        Manage <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* COMPLETED TAB */}
          <TabsContent value="completed" className="space-y-4">
            {pastProjects.length === 0 ? (
              <Card>
                <CardContent className="pt-10 text-center">
                  <p className="text-slate-500">No completed projects yet</p>
                </CardContent>
              </Card>
            ) : (
              pastProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">{project.address}</h3>
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {project.status?.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                          <div>
                            <p className="text-slate-400 text-xs">Roofer</p>
                            <p className="font-semibold text-slate-900">{project.roofer_company}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs">Total Cost</p>
                            <p className="font-semibold text-slate-900">
                              ${project.contract_amount?.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs">Completed</p>
                            <p className="font-semibold text-slate-900">
                              {project.actual_completion || "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => navigate(createPageUrl("ProjectView") + `?id=${project.id}&role=homeowner`)}
                      >
                        View <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}