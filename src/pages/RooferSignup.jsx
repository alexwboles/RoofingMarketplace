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
  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    license_number: "",
    service_areas_text: "",
    specialties_text: "",
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
      service_areas: form.service_areas_text
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      specialties: form.specialties_text
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
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