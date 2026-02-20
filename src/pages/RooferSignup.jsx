import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Building2, User, Mail, Phone, FileText,
  MapPin, Loader2, CheckCircle2, Hammer, ShieldCheck, ShieldAlert, Sparkles,
  TrendingUp, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function RooferSignup() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verification, setVerification] = useState(null); // AI verification result
  const [pricingSuggestion, setPricingSuggestion] = useState(null);
  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    license_number: "",
    years_experience: "",
    service_areas_text: "",
    specialties_text: "",
    annual_revenue: "",
    insurance_carrier: "",
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const runAIVerification = async () => {
    if (!form.company_name || !form.license_number || !form.service_areas_text) {
      toast.error("Please fill in company name, license number, and service areas first.");
      return;
    }
    setIsVerifying(true);
    setVerification(null);
    setPricingSuggestion(null);

    const result = await base44.integrations.Core.InvokeLLM({
      add_context_from_internet: true,
      prompt: `You are a contractor verification and pricing strategy AI for a roofing marketplace.

Verify and assess this roofing contractor application:
- Company: "${form.company_name}"
- License #: "${form.license_number}"
- Contact: "${form.contact_name}"
- Phone: "${form.phone}"
- Service Areas: "${form.service_areas_text}"
- Specialties: "${form.specialties_text}"
- Years Experience: "${form.years_experience || "not provided"}"
- Insurance Carrier: "${form.insurance_carrier || "not provided"}"
- Annual Revenue: "${form.annual_revenue || "not provided"}"

STEP 1 — LICENSE VERIFICATION:
Search for this contractor license number "${form.license_number}" in any US state contractor licensing databases. Check if the license appears valid for the service area provided. Return license_status: "verified", "likely_valid", "not_found", or "suspicious".

STEP 2 — COMPANY REPUTATION:
Search for "${form.company_name}" in the service area "${form.service_areas_text}". Look for BBB ratings, Google reviews, news mentions, complaints. Return reputation_score (1-10) and any notable findings.

STEP 3 — MARKET RATE ANALYSIS:
Research current labor rates for roofing contractors in "${form.service_areas_text}". Suggest a competitive pricing strategy based on:
- Local market rates
- Competition level in that area
- Contractor's stated experience level
Return: suggested_base_rate_per_sq ($/sq = 100 sq ft), pricing_tier, market_notes.

STEP 4 — RISK ASSESSMENT:
Based on all findings, provide: overall_risk: "low", "medium", or "high", and recommendation: "approve", "review", or "reject".`,
      response_json_schema: {
        type: "object",
        properties: {
          license_status: { type: "string" },
          license_notes: { type: "string" },
          reputation_score: { type: "number" },
          reputation_notes: { type: "string" },
          suggested_base_rate_per_sq: { type: "number" },
          pricing_tier: { type: "string" },
          market_notes: { type: "string" },
          overall_risk: { type: "string" },
          recommendation: { type: "string" },
          recommendation_reason: { type: "string" }
        }
      }
    });

    setVerification(result);
    setPricingSuggestion({
      base_rate: result.suggested_base_rate_per_sq,
      tier: result.pricing_tier,
      notes: result.market_notes,
    });
    setIsVerifying(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    await base44.entities.Roofer.create({
      company_name: form.company_name,
      contact_name: form.contact_name,
      email: form.email,
      phone: form.phone,
      license_number: form.license_number,
      service_areas: form.service_areas_text.split(",").map((s) => s.trim()).filter(Boolean),
      specialties: form.specialties_text.split(",").map((s) => s.trim()).filter(Boolean),
      status: "pending",
      rating: 0,
      total_reviews: 0,
      leads_claimed: 0,
    });

    await base44.integrations.Core.SendEmail({
      to: form.email,
      subject: "Welcome to RoofQuote AI!",
      body: `Hi ${form.contact_name},\n\nThank you for signing up as a roofing contractor on RoofQuote AI!\n\nYour application is under review. Once approved, you'll start receiving pre-qualified leads with detailed roof measurements.\n\nBest,\nRoofQuote AI Team`,
    });

    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success("Application submitted successfully!");
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border-2 border-emerald-200 p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted!</h2>
          <p className="text-slate-500">
            We'll review your application and get back to you within 1-2 business days.
          </p>
          <Button
            onClick={() => navigate(createPageUrl("Home"))}
            className="mt-6 bg-gradient-to-r from-amber-500 to-orange-500"
          >
            Back to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Home"))}
            className="text-slate-300 hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <Hammer className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Become a Partner Roofer</h1>
              <p className="text-slate-300 mt-1">
                Receive pre-qualified leads with detailed roof measurements.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 -mt-6">
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-slate-600">Company Name</Label>
                  <div className="relative mt-1">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={form.company_name}
                      onChange={(e) => handleChange("company_name", e.target.value)}
                      placeholder="ABC Roofing"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-slate-600">Contact Name</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={form.contact_name}
                      onChange={(e) => handleChange("contact_name", e.target.value)}
                      placeholder="John Smith"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-slate-600">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="john@abcroofing.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-slate-600">Phone</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="(555) 123-4567"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm text-slate-600">License Number</Label>
                <div className="relative mt-1">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={form.license_number}
                    onChange={(e) => handleChange("license_number", e.target.value)}
                    placeholder="ROC-123456"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm text-slate-600">Service Areas</Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Textarea
                    value={form.service_areas_text}
                    onChange={(e) => handleChange("service_areas_text", e.target.value)}
                    placeholder="Enter zip codes or cities, separated by commas (e.g. 85001, Phoenix, Scottsdale)"
                    className="pl-10 min-h-[80px]"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm text-slate-600">Specialties</Label>
                <Textarea
                  value={form.specialties_text}
                  onChange={(e) => handleChange("specialties_text", e.target.value)}
                  placeholder="e.g. Shingle, Metal, Tile, Flat Roof, Storm Damage"
                  className="min-h-[60px] mt-1"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 font-semibold rounded-xl shadow-lg shadow-amber-500/20"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Submit Application"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}