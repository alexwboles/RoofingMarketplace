import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft, Star, MapPin, Phone, Mail, Shield, Award,
  CheckCircle2, Hammer, Clock, Users, Loader2, MessageSquare
} from "lucide-react";
import RooferReviews from "@/components/roofer/RooferReviews";

const tierColors = {
  basic: "bg-slate-50 text-slate-600 border-slate-200",
  pro: "bg-blue-50 text-blue-700 border-blue-200",
  premium: "bg-amber-50 text-amber-700 border-amber-200",
};

const specialtyIcons = {
  "asphalt": "🏠",
  "metal": "🔩",
  "tile": "🏛️",
  "slate": "🪨",
  "flat": "📐",
};

function getSpecialtyIcon(specialty = "") {
  const s = specialty.toLowerCase();
  for (const [key, icon] of Object.entries(specialtyIcons)) {
    if (s.includes(key)) return icon;
  }
  return "🔨";
}

export default function RooferProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const rooferId = urlParams.get("id");
  const navigate = useNavigate();
  const [roofer, setRoofer] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!rooferId) { setLoading(false); return; }
    Promise.all([
      base44.entities.Roofer.filter({ id: rooferId }),
      base44.entities.Lead.filter({ roofer_id: rooferId }),
      base44.entities.Review.filter({ roofer_id: rooferId }),
    ]).then(([rooferRes, leadsRes, reviewsRes]) => {
      setRoofer(rooferRes[0] || null);
      setLeads(leadsRes || []);
      setReviews(reviewsRes || []);
      setLoading(false);
    });
  }, [rooferId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
      </div>
    );
  }

  if (!roofer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Roofer profile not found.</p>
          <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length)
    : (roofer.rating || 4.5);
  const stars = avgRating;
  const reviewCount = reviews.length || roofer.total_reviews || 0;
  const wonLeads = leads.filter((l) => l.status === "won" || l.status === "accepted").length;


  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-10">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-slate-300 hover:text-white mb-6 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Logo / Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl shadow-lg shrink-0">
              {roofer.logo_url ? (
                <img src={roofer.logo_url} alt="logo" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <Hammer className="w-9 h-9 text-white" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-white">{roofer.company_name}</h1>
                <Badge className={`${tierColors[roofer.subscription_tier || "basic"]} border text-xs`}>
                  {roofer.subscription_tier || "basic"} plan
                </Badge>
                {roofer.status === "approved" && (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 border text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`w-4 h-4 ${n <= Math.round(stars) ? "text-amber-400 fill-amber-400" : "text-slate-600"}`}
                  />
                ))}
                <span className="text-sm text-slate-300 ml-1">{stars.toFixed(1)} ({reviewCount} reviews)</span>
              </div>

              {roofer.service_areas?.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-slate-400">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Serves: {roofer.service_areas.join(", ")}</span>
                </div>
              )}
            </div>

            {/* Contact CTA */}
            <div className="flex flex-col gap-2 shrink-0">
              {roofer.phone && (
                <a href={`tel:${roofer.phone}`}>
                  <Button className="bg-amber-500 hover:bg-amber-600 text-white gap-2 w-full">
                    <Phone className="w-4 h-4" /> {roofer.phone}
                  </Button>
                </a>
              )}
              {roofer.email && (
                <a href={`mailto:${roofer.email}`}>
                  <Button variant="outline" className="text-slate-300 border-slate-600 hover:bg-slate-700 gap-2 w-full">
                    <Mail className="w-4 h-4" /> Email
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Star, label: "Rating", value: stars.toFixed(1), color: "text-amber-500" },
            { icon: Users, label: "Reviews", value: reviewCount.toLocaleString(), color: "text-blue-500" },
            { icon: CheckCircle2, label: "Jobs Won", value: wonLeads, color: "text-emerald-500" },
            { icon: Clock, label: "Member Since", value: roofer.created_date ? new Date(roofer.created_date).getFullYear() : "—", color: "text-violet-500" },
          ].map((s, i) => (
            <Card key={i} className="border-slate-200">
              <CardContent className="pt-4 pb-4 text-center">
                <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1.5`} />
                <p className="text-xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* About / Contact */}
          <Card className="border-slate-200">
            <CardContent className="pt-5 space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contact Information</p>
              {[
                { label: "Contact", value: roofer.contact_name, icon: Users },
                { label: "Phone", value: roofer.phone, icon: Phone },
                { label: "Email", value: roofer.email, icon: Mail },
                { label: "License #", value: roofer.license_number, icon: Shield },
              ].map((row, i) => row.value && (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <row.icon className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">{row.label}</p>
                    <p className="text-sm font-medium text-slate-800">{row.value}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Specialties */}
          <Card className="border-slate-200">
            <CardContent className="pt-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Specialties</p>
              {roofer.specialties?.length ? (
                <div className="flex flex-wrap gap-2">
                  {roofer.specialties.map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                      <span>{getSpecialtyIcon(s)}</span>
                      <span className="text-sm text-slate-700">{s}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No specialties listed.</p>
              )}

              {roofer.service_areas?.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-5 mb-3">Service Areas</p>
                  <div className="flex flex-wrap gap-2">
                    {roofer.service_areas.map((area, i) => (
                      <div key={i} className="flex items-center gap-1 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
                        <MapPin className="w-3 h-3 text-blue-500" />
                        <span className="text-sm text-blue-700">{area}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bio */}
        {roofer.bio && (
          <Card className="border-slate-200">
            <CardContent className="pt-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">About</p>
              <p className="text-sm text-slate-700 leading-relaxed">{roofer.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Credentials */}
        <div className="flex flex-wrap gap-3">
          {roofer.license_number && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-800">Licensed & Insured</p>
                <p className="text-xs text-emerald-600">License #{roofer.license_number}</p>
              </div>
            </div>
          )}
          {roofer.years_in_business && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
              <Award className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-blue-800">{roofer.years_in_business}+ Years</p>
                <p className="text-xs text-blue-600">In Business</p>
              </div>
            </div>
          )}
          {roofer.certifications?.map((cert, i) => (
            <div key={i} className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl px-4 py-2.5">
              <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0" />
              <p className="text-xs font-semibold text-violet-800">{cert}</p>
            </div>
          ))}
        </div>

        {/* Portfolio Gallery */}
        {roofer.portfolio_images?.length > 0 && (
          <Card className="border-slate-200">
            <CardContent className="pt-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Portfolio</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {roofer.portfolio_images.map((url, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-200">
                    <img src={url} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-800">Customer Reviews</h2>
          </div>
          <RooferReviews reviews={reviews} />
        </div>

        {/* Get a Quote CTA */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-center text-white">
          <h3 className="text-lg font-bold mb-1">Ready to get started?</h3>
          <p className="text-sm text-amber-100 mb-4">Get a free AI-powered roof estimate in minutes.</p>
          <Button
            onClick={() => navigate(createPageUrl("Home"))}
            className="bg-white text-amber-600 hover:bg-amber-50 font-semibold"
          >
            Get My Free Estimate
          </Button>
        </div>
      </div>
    </div>
  );
}