import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Star, MapPin, Phone, Mail, Shield, Loader2,
  Hammer, Users, Award, SearchX
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default function RoofersList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTier, setFilterTier] = useState("all");

  const { data: roofers = [], isLoading } = useQuery({
    queryKey: ["roofers"],
    queryFn: () => base44.entities.Roofer.filter({ status: "approved" }, "-rating", 50),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews"],
    queryFn: () => base44.entities.Review.list("-created_date", 500),
  });

  const tierColors = {
    basic: "bg-slate-50 text-slate-600 border-slate-200",
    pro: "bg-blue-50 text-blue-700 border-blue-200",
    premium: "bg-amber-50 text-amber-700 border-amber-200",
  };

  const filtered = roofers.filter((r) => {
    const matchesSearch =
      r.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.specialties?.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.service_areas?.some((a) => a.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTier = filterTier === "all" || r.subscription_tier === filterTier;

    return matchesSearch && matchesTier;
  });

  const getRooferStats = (rooferId) => {
    const rooferReviews = reviews.filter((r) => r.roofer_id === rooferId);
    const avgRating =
      rooferReviews.length > 0
        ? rooferReviews.reduce((s, r) => s + (r.rating || 0), 0) / rooferReviews.length
        : 4.5;
    return {
      avgRating: avgRating.toFixed(1),
      reviewCount: rooferReviews.length,
    };
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(createPageUrl("Home"))}
            className="text-slate-600 hover:text-slate-900 mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Home
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">Browse Roofers</h1>
          <p className="text-sm text-slate-500 mt-1">
            Find and connect with verified roofing contractors
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Input
            placeholder="Search by company, specialty, or service area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:col-span-2"
          />
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Plans</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
            <option value="premium">Premium</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <SearchX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No roofers found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((roofer) => {
              const stats = getRooferStats(roofer.id);
              return (
                <Card
                  key={roofer.id}
                  className="hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
                  onClick={() => navigate(createPageUrl("RooferProfile") + `?id=${roofer.id}`)}
                >
                  {/* Header */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-lg shrink-0">
                      {roofer.logo_url ? (
                        <img
                          src={roofer.logo_url}
                          alt="logo"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <Hammer className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">
                        {roofer.company_name}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`w-3.5 h-3.5 ${
                              n <= Math.round(stats.avgRating)
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-600"
                            }`}
                          />
                        ))}
                        <span className="text-xs text-slate-300 ml-1">
                          {stats.avgRating} ({stats.reviewCount})
                        </span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="pt-4 space-y-4">
                    {/* Tier Badge */}
                    <Badge
                      className={`${tierColors[roofer.subscription_tier || "basic"]} border`}
                    >
                      {roofer.subscription_tier || "basic"} plan
                    </Badge>

                    {/* Contact */}
                    {roofer.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-700">{roofer.phone}</span>
                      </div>
                    )}

                    {roofer.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-700 truncate">{roofer.email}</span>
                      </div>
                    )}

                    {/* License */}
                    {roofer.license_number && (
                      <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1.5">
                        <Shield className="w-4 h-4 shrink-0" />
                        <span className="text-xs">Licensed & Insured</span>
                      </div>
                    )}

                    {/* Specialties */}
                    {roofer.specialties?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 mb-2">
                          Specialties
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {roofer.specialties.slice(0, 3).map((s, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs bg-slate-50"
                            >
                              {s}
                            </Badge>
                          ))}
                          {roofer.specialties.length > 3 && (
                            <span className="text-xs text-slate-500">
                              +{roofer.specialties.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Service Areas */}
                    {roofer.service_areas?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 mb-2">
                          Service Areas
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {roofer.service_areas.slice(0, 3).map((area, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-1 bg-blue-50 rounded-lg px-2 py-1 text-xs text-blue-700"
                            >
                              <MapPin className="w-3 h-3" />
                              {area}
                            </div>
                          ))}
                          {roofer.service_areas.length > 3 && (
                            <span className="text-xs text-slate-500">
                              +{roofer.service_areas.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* View Profile Button */}
                    <Button className="w-full mt-4 bg-amber-600 hover:bg-amber-700">
                      View Profile
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}