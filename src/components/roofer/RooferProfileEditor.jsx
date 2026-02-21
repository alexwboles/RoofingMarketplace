import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Phone, Mail, Shield, MapPin, Wrench, Award, Image,
  Plus, X, Check, Loader2, Camera, Upload
} from "lucide-react";
import { toast } from "sonner";

const MATERIAL_OPTIONS = [
  "3-Tab Shingle", "Architectural Shingle", "Premium Shingle",
  "Metal Standing Seam", "Metal Corrugated", "Clay Tile", "Concrete Tile", "Slate", "Flat/TPO", "Flat/EPDM"
];

const CERTIFICATION_OPTIONS = [
  "GAF Master Elite", "CertainTeed ShingleMaster", "Owens Corning Preferred", "IKO Shieldpro",
  "OSHA Certified", "NRCA Member", "BBB Accredited", "EPA Lead-Safe Certified"
];

export default function RooferProfileEditor({ roofer, onSave }) {
  const [form, setForm] = useState({
    company_name: roofer?.company_name || "",
    contact_name: roofer?.contact_name || "",
    phone: roofer?.phone || "",
    email: roofer?.email || "",
    license_number: roofer?.license_number || "",
    logo_url: roofer?.logo_url || "",
    service_areas: roofer?.service_areas || [],
    specialties: roofer?.specialties || [],
    certifications: roofer?.certifications || [],
    portfolio_images: roofer?.portfolio_images || [],
    bio: roofer?.bio || "",
    years_in_business: roofer?.years_in_business || "",
    website: roofer?.website || "",
  });
  const [saving, setSaving] = useState(false);
  const [newArea, setNewArea] = useState("");
  const [newCert, setNewCert] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const addTag = (field, value, setter) => {
    const v = value.trim();
    if (!v || form[field].includes(v)) return;
    set(field, [...form[field], v]);
    setter("");
  };

  const removeTag = (field, idx) => set(field, form[field].filter((_, i) => i !== idx));

  const toggleMaterial = (mat) => {
    const arr = form.specialties;
    set("specialties", arr.includes(mat) ? arr.filter(m => m !== mat) : [...arr, mat]);
  };

  const toggleCert = (cert) => {
    const arr = form.certifications;
    set("certifications", arr.includes(cert) ? arr.filter(c => c !== cert) : [...arr, cert]);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("logo_url", file_url);
    setUploadingLogo(false);
  };

  const handlePortfolioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPortfolio(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("portfolio_images", [...form.portfolio_images, file_url]);
    setUploadingPortfolio(false);
  };

  const addPortfolioUrl = () => {
    const v = newImageUrl.trim();
    if (!v) return;
    set("portfolio_images", [...form.portfolio_images, v]);
    setNewImageUrl("");
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Roofer.update(roofer.id, form);
    toast.success("Profile updated!");
    onSave?.();
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Company Info */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5" /> Company Information
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1">Company Name</Label>
              <Input value={form.company_name} onChange={e => set("company_name", e.target.value)} placeholder="ABC Roofing Co." />
            </div>
            <div>
              <Label className="text-xs mb-1">Contact Name</Label>
              <Input value={form.contact_name} onChange={e => set("contact_name", e.target.value)} placeholder="John Smith" />
            </div>
            <div>
              <Label className="text-xs mb-1">Phone</Label>
              <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(555) 555-1234" />
            </div>
            <div>
              <Label className="text-xs mb-1">Email</Label>
              <Input value={form.email} onChange={e => set("email", e.target.value)} placeholder="contact@company.com" />
            </div>
            <div>
              <Label className="text-xs mb-1">License Number</Label>
              <Input value={form.license_number} onChange={e => set("license_number", e.target.value)} placeholder="ROC-12345" />
            </div>
            <div>
              <Label className="text-xs mb-1">Years in Business</Label>
              <Input type="number" value={form.years_in_business} onChange={e => set("years_in_business", e.target.value)} placeholder="10" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs mb-1">Website</Label>
              <Input value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://yourcompany.com" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs mb-1">About Your Company</Label>
              <textarea
                value={form.bio}
                onChange={e => set("bio", e.target.value)}
                rows={3}
                placeholder="Tell homeowners about your company, experience, and what sets you apart..."
                className="w-full border border-input rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Camera className="w-3.5 h-3.5" /> Company Logo
          </p>
          <div className="flex items-center gap-4">
            {form.logo_url ? (
              <img src={form.logo_url} alt="Logo" className="w-20 h-20 rounded-xl object-cover border border-slate-200" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                <Building2 className="w-8 h-8" />
              </div>
            )}
            <div>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <span>
                    {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {uploadingLogo ? "Uploading..." : "Upload Logo"}
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Areas */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" /> Service Areas
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {form.service_areas.map((area, i) => (
              <span key={i} className="flex items-center gap-1 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1 text-sm text-blue-700">
                <MapPin className="w-3 h-3" /> {area}
                <button onClick={() => removeTag("service_areas", i)} className="ml-1 text-blue-400 hover:text-blue-700">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newArea}
              onChange={e => setNewArea(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTag("service_areas", newArea, setNewArea)}
              placeholder="Add zip code or city (press Enter)"
              className="text-sm"
            />
            <Button size="sm" variant="outline" onClick={() => addTag("service_areas", newArea, setNewArea)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Accepted Materials */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Wrench className="w-3.5 h-3.5" /> Accepted Materials
          </p>
          <div className="flex flex-wrap gap-2">
            {MATERIAL_OPTIONS.map((mat) => (
              <button
                key={mat}
                onClick={() => toggleMaterial(mat)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  form.specialties.includes(mat)
                    ? "bg-amber-50 border-amber-300 text-amber-800 font-medium"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {form.specialties.includes(mat) && <Check className="w-3 h-3 inline mr-1" />}
                {mat}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-3.5 h-3.5" /> Certifications & Credentials
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {CERTIFICATION_OPTIONS.map((cert) => (
              <button
                key={cert}
                onClick={() => toggleCert(cert)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  form.certifications.includes(cert)
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-medium"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {form.certifications.includes(cert) && <Shield className="w-3 h-3 inline mr-1" />}
                {cert}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newCert}
              onChange={e => setNewCert(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTag("certifications", newCert, setNewCert)}
              placeholder="Add custom certification"
              className="text-sm"
            />
            <Button size="sm" variant="outline" onClick={() => addTag("certifications", newCert, setNewCert)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {form.certifications.filter(c => !CERTIFICATION_OPTIONS.includes(c)).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.certifications.filter(c => !CERTIFICATION_OPTIONS.includes(c)).map((c, i) => (
                <span key={i} className="flex items-center gap-1 bg-violet-50 border border-violet-100 rounded-lg px-3 py-1 text-sm text-violet-700">
                  {c}
                  <button onClick={() => set("certifications", form.certifications.filter(x => x !== c))} className="ml-1 text-violet-400 hover:text-violet-700">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Gallery */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Image className="w-3.5 h-3.5" /> Portfolio / Gallery
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
            {form.portfolio_images.map((url, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden aspect-square border border-slate-200">
                <img src={url} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => set("portfolio_images", form.portfolio_images.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <label className="cursor-pointer aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-slate-300 transition-colors">
              <input type="file" accept="image/*" className="hidden" onChange={handlePortfolioUpload} />
              {uploadingPortfolio ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span className="text-xs">Upload</span>
                </>
              )}
            </label>
          </div>
          <div className="flex gap-2">
            <Input
              value={newImageUrl}
              onChange={e => setNewImageUrl(e.target.value)}
              placeholder="Or paste an image URL"
              className="text-sm"
            />
            <Button size="sm" variant="outline" onClick={addPortfolioUrl}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white h-11"
      >
        {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving…</> : <><Check className="w-4 h-4 mr-2" /> Save Profile</>}
      </Button>
    </div>
  );
}