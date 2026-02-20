import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AnalyzingOverlay from "@/components/quote/AnalyzingOverlay";
import RoofAnalysisCard from "@/components/quote/RoofAnalysisCard";
import MaterialsList from "@/components/quote/MaterialsList";
import PriceEstimate from "@/components/quote/PriceEstimate";
import MaterialTypeSelector from "@/components/quote/MaterialTypeSelector";
import ContactForm from "@/components/quote/ContactForm";
import RoofAreaEditor from "@/components/quote/RoofAreaEditor";
import RoofReport from "@/components/quote/RoofReport";
import RooferProposals from "@/components/quote/RooferProposals";
import PaymentTypeSelector from "@/components/quote/PaymentTypeSelector";
import PropertyDetailsForm from "@/components/quote/PropertyDetailsForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

// Generate a realistic roof polygon centered in the satellite view
// The satellite is zoomed to z=20, which shows roughly 50-80m across for a typical home.
// We place the roof outline in the center ~40% of the canvas to approximate the actual structure.
function generateRoofPolygon(i, total, sectionFraction, complexity) {
  const W = 640, H = 360;
  // Roof occupies roughly the center 42% width and 38% height of the satellite at z=20
  const roofW = W * 0.42;
  const roofH = H * 0.38;
  const cx = W / 2;
  const cy = H / 2;

  if (total === 1) {
    // Single polygon shaped like a simple gable/hip roof
    if (complexity === "simple") {
      // Gable: rectangle
      const hw = roofW / 2, hh = roofH / 2;
      return [
        { x: cx - hw, y: cy - hh },
        { x: cx + hw, y: cy - hh },
        { x: cx + hw, y: cy + hh },
        { x: cx - hw, y: cy + hh },
      ];
    } else {
      // Hip roof: octagon-ish
      const hw = roofW / 2, hh = roofH / 2, cut = roofH * 0.2;
      return [
        { x: cx - hw + cut, y: cy - hh },
        { x: cx + hw - cut, y: cy - hh },
        { x: cx + hw, y: cy - hh + cut },
        { x: cx + hw, y: cy + hh - cut },
        { x: cx + hw - cut, y: cy + hh },
        { x: cx - hw + cut, y: cy + hh },
        { x: cx - hw, y: cy + hh - cut },
        { x: cx - hw, y: cy - hh + cut },
      ];
    }
  }

  // Multiple sections — split the roof area
  const cols = total <= 2 ? total : 2;
  const rows = Math.ceil(total / cols);
  const col = i % cols;
  const row = Math.floor(i / cols);
  const secW = roofW / cols;
  const secH = roofH / rows;
  const gap = 4;
  const x1 = cx - roofW / 2 + col * secW + gap;
  const y1 = cy - roofH / 2 + row * secH + gap;
  const x2 = x1 + secW - gap * 2;
  const y2 = y1 + secH - gap * 2;
  // Fraction scales the polygon area proportionally
  const scaleX = Math.sqrt(sectionFraction || 1);
  const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;
  const sx1 = midX - (midX - x1) * scaleX;
  const sx2 = midX + (x2 - midX) * scaleX;
  return [
    { x: sx1, y: y1 },
    { x: sx2, y: y1 },
    { x: sx2, y: y2 },
    { x: sx1, y: y2 },
  ];
}

export default function QuoteResult() {
  const [quote, setQuote] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [materialType, setMaterialType] = useState("architectural_shingle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [isMatchingRoofers, setIsMatchingRoofers] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [roofSections, setRoofSections] = useState([]);
  const [paymentType, setPaymentType] = useState("personal");
  const [propertyDetails, setPropertyDetails] = useState({});

  const urlParams = new URLSearchParams(window.location.search);
  const quoteId = urlParams.get("id");
  const navigate = useNavigate();

  const analyzeRoof = useCallback(async (quoteData, extraDetails = {}) => {
    const detailsContext = [
      extraDetails.home_sqft ? `Living area square footage: ${extraDetails.home_sqft} sq ft` : "",
      extraDetails.roof_age ? `Roof age: ${extraDetails.roof_age.replace(/_/g, " ")}` : "",
      extraDetails.concerns ? `Known issues/concerns: ${extraDetails.concerns}` : "",
      extraDetails.upgrades ? `Desired upgrades/add-ons: ${extraDetails.upgrades}` : "",
    ].filter(Boolean).join("\n");

    const analysis = await base44.integrations.Core.InvokeLLM({
      add_context_from_internet: true,
      prompt: `You are a professional roofing estimator with 20+ years of field experience and access to satellite imagery data. Analyze this specific property and produce a highly accurate roof measurement and difficulty report.

Property Address: "${quoteData.address}"
${detailsContext ? `\nHomeowner-provided details:\n${detailsContext}` : ""}

STEP 1 — RESEARCH THIS PROPERTY:
Use your internet access to look up:
- The actual home size / footprint from public records or real estate listings for this address
- The typical housing style, age, and construction in this specific neighborhood/zip code
- Local climate and weather patterns that affect roofing material choices
- Street view / satellite knowledge of the roof style

STEP 2 — CALCULATE ROOF AREA WITH PITCH & OVERHANG:
Pitch multipliers (slope / run):
  2/12 = 1.028 | 3/12 = 1.054 | 4/12 = 1.054 | 5/12 = 1.083
  6/12 = 1.118 | 7/12 = 1.158 | 8/12 = 1.202 | 10/12 = 1.302 | 12/12 = 1.414

Overhang allowance: typical residential overhang is 12–24 inches. Add 1.5–2.5% to footprint per overhang foot.
Formula: roof_area = (footprint + overhang_area) × pitch_multiplier × waste_factor
Waste factor: simple=1.08, moderate=1.12, complex=1.15

${extraDetails.home_sqft
  ? `The homeowner says their living area is ${extraDetails.home_sqft} sq ft. 
     Footprint ≈ living area (for single story) or living area / stories (for multi-story).
     COMPUTE step by step: footprint → add overhang → × pitch_multiplier → × waste_factor = total_area_sqft.`
  : `Estimate the home footprint from public records or typical housing for this zip code. NEVER guess below 1,000 sq ft for a single-family home.`}

STEP 3 — IDENTIFY CURRENT ROOF MATERIAL from satellite/public data.

STEP 4 — DIFFICULTY ASSESSMENT:
Assign a difficulty_score from 1–10 and list specific difficulty_factors:
- Steep pitch (>8/12) adds 20–30% labor
- High stories (2+) adds 15% labor
- Many valleys/penetrations add complexity
- Poor access or obstacles (trees, tight lot) increase risk
- Existing deck damage or multiple layers to tear off
- Return: difficulty_score (1=trivial, 10=extreme), difficulty_factors (array of strings), pitch_multiplier (the numeric value used), overhang_inches (estimated overhang depth), waste_factor (value used)

STEP 5 — GENERATE ACCURATE MEASUREMENTS consistent with total_area_sqft.

Return all fields including:
- total_area_sqft, pitch, pitch_multiplier, overhang_inches, waste_factor
- difficulty_score (1-10), difficulty_factors (string array)
- num_facets, num_peaks, num_valleys, num_hips
- ridge_length_ft, eave_length_ft, rake_length_ft, valley_length_ft
- obstacles: [{type, count}]
- complexity: "simple" | "moderate" | "complex"
- stories, current_material, current_material_label
- roof_sections: [{name, area_sqft, pitch}] — must sum to total_area_sqft
- ai_suggestions: 2-3 specific tips for this property/climate`,
      response_json_schema: {
        type: "object",
        properties: {
          total_area_sqft: { type: "number" },
          pitch: { type: "string" },
          pitch_multiplier: { type: "number" },
          overhang_inches: { type: "number" },
          waste_factor: { type: "number" },
          difficulty_score: { type: "number" },
          difficulty_factors: { type: "array", items: { type: "string" } },
          num_facets: { type: "number" },
          num_peaks: { type: "number" },
          num_valleys: { type: "number" },
          num_hips: { type: "number" },
          ridge_length_ft: { type: "number" },
          eave_length_ft: { type: "number" },
          rake_length_ft: { type: "number" },
          valley_length_ft: { type: "number" },
          obstacles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                count: { type: "number" }
              }
            }
          },
          complexity: { type: "string" },
          stories: { type: "number" },
          current_material: { type: "string" },
          current_material_label: { type: "string" },
          ai_suggestions: { type: "array", items: { type: "string" } },
          roof_sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                area_sqft: { type: "number" },
                pitch: { type: "string" }
              }
            }
          }
        }
      }
    });

    return analysis;
  }, []);

  const generateMaterialsAndPricing = useCallback(async (analysis, matType) => {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a roofing cost estimation AI. Given this roof analysis, generate a detailed materials list and pricing for a "${matType}" roof replacement.

Roof Analysis:
- Total Area: ${analysis.total_area_sqft} sq ft
- Pitch: ${analysis.pitch} (multiplier: ${analysis.pitch_multiplier || "estimated"})
- Overhang: ${analysis.overhang_inches || 12} inches
- Waste Factor: ${analysis.waste_factor || 1.10}
- Difficulty Score: ${analysis.difficulty_score || 5}/10
- Difficulty Factors: ${(analysis.difficulty_factors || []).join("; ") || "standard"}
- Facets: ${analysis.num_facets}, Complexity: ${analysis.complexity}
- Peaks: ${analysis.num_peaks}, Valleys: ${analysis.num_valleys}, Hips: ${analysis.num_hips}
- Ridge: ${analysis.ridge_length_ft} ft, Eave: ${analysis.eave_length_ft} ft
- Rake: ${analysis.rake_length_ft} ft, Valley: ${analysis.valley_length_ft} ft
- Obstacles: ${JSON.stringify(analysis.obstacles)}
- Stories: ${analysis.stories}

DIFFICULTY-ADJUSTED LABOR:
Base labor rate for this material = standard $/sq ft.
Apply difficulty multiplier: difficulty_score 1-4 = 1.0×, 5-6 = 1.15×, 7-8 = 1.30×, 9-10 = 1.50×.
Steep pitch surcharge (>8/12): add 25% to labor.
Multi-story surcharge: add 15% to labor per story above 1.

Generate a realistic materials list with current 2026 pricing. Include all necessary items: shingles/roofing material, underlayment, ice & water shield, drip edge, ridge cap, flashing, pipe boots, nails, starter strip, hip & ridge shingles, ventilation, etc.

Calculate:
- materials_cost (total material cost)
- labor_cost (difficulty-adjusted labor)
- estimated_total (materials + labor)
- price_range_low (estimated_total minus ~8%)
- price_range_high (estimated_total plus ~15%, accounting for contractor markup and contingencies)`,
      response_json_schema: {
        type: "object",
        properties: {
          materials: {
            type: "array",
            items: {
              type: "object",
              properties: {
                item: { type: "string" },
                quantity: { type: "number" },
                unit: { type: "string" },
                unit_cost: { type: "number" },
                total_cost: { type: "number" }
              }
            }
          },
          materials_cost: { type: "number" },
          labor_cost: { type: "number" },
          estimated_total: { type: "number" },
          price_range_low: { type: "number" },
          price_range_high: { type: "number" }
        }
      }
    });

    return result;
  }, []);

  useEffect(() => {
    if (!quoteId) return;

    const loadAndAnalyze = async () => {
      const q = await base44.entities.RoofQuote.filter({ id: quoteId });
      if (!q.length) return;
      const quoteData = q[0];

      if (quoteData.status !== "analyzing") {
        setQuote(quoteData);
        setMaterialType(quoteData.material_type || "architectural_shingle");
        // Restore sections from saved analysis
        const savedSections = quoteData.roof_analysis?.roof_sections;
        if (savedSections?.length) {
          const total = savedSections.reduce((s, x) => s + (x.area_sqft || 0), 0);
          setRoofSections(savedSections.map((s, i) => ({
            name: s.name,
            area_sqft: s.area_sqft,
            color: i % 6,
            points: generateRoofPolygon(i, savedSections.length, total > 0 ? s.area_sqft / total : 1, quoteData.roof_analysis?.complexity),
          })));
        }
        setIsAnalyzing(false);
        return;
      }

      // Run analysis
      const analysis = await analyzeRoof(quoteData);

      // Generate materials and pricing
      const pricing = await generateMaterialsAndPricing(analysis, "architectural_shingle");

      // Update the quote
      const updatedQuote = {
        roof_analysis: analysis,
        materials_list: pricing.materials,
        materials_cost: pricing.materials_cost,
        labor_cost: pricing.labor_cost,
        estimated_total: pricing.estimated_total,
        price_range_low: pricing.price_range_low,
        price_range_high: pricing.price_range_high,
        material_type: "architectural_shingle",
        status: "quoted",
      };

      await base44.entities.RoofQuote.update(quoteId, updatedQuote);

      const secTotal = (analysis.roof_sections || []).reduce((sum, s) => sum + (s.area_sqft || 0), 0);
      const initialSections = (analysis.roof_sections || []).map((s, i) => ({
        name: s.name,
        area_sqft: s.area_sqft,
        color: i % 6,
        points: generateRoofPolygon(i, analysis.roof_sections.length, secTotal > 0 ? s.area_sqft / secTotal : 1, analysis.complexity),
      }));
      setRoofSections(initialSections);

      setQuote({ ...quoteData, ...updatedQuote });
      setTimeout(() => setIsAnalyzing(false), 1500);
    };

    loadAndAnalyze();
  }, [quoteId, analyzeRoof, generateMaterialsAndPricing]);

  const handleAnalysisEdit = async (updatedAnalysis) => {
    const pricing = await generateMaterialsAndPricing(updatedAnalysis, materialType);
    const updates = {
      roof_analysis: updatedAnalysis,
      materials_list: pricing.materials,
      materials_cost: pricing.materials_cost,
      labor_cost: pricing.labor_cost,
      estimated_total: pricing.estimated_total,
      price_range_low: pricing.price_range_low,
      price_range_high: pricing.price_range_high,
    };
    await base44.entities.RoofQuote.update(quoteId, updates);
    setQuote((prev) => ({ ...prev, ...updates }));
  };

  const handleSectionsChange = async (sections, totalSqft) => {
    setRoofSections(sections);
    const updatedAnalysis = { ...quote.roof_analysis, total_area_sqft: totalSqft };
    await handleAnalysisEdit(updatedAnalysis);
    toast.success("Roof area updated from sections!");
  };

  const handleMaterialChange = async (newType) => {
    if (!quote?.roof_analysis) return;
    setMaterialType(newType);

    const pricing = await generateMaterialsAndPricing(quote.roof_analysis, newType);

    const updates = {
      material_type: newType,
      materials_list: pricing.materials,
      materials_cost: pricing.materials_cost,
      labor_cost: pricing.labor_cost,
      estimated_total: pricing.estimated_total,
      price_range_low: pricing.price_range_low,
      price_range_high: pricing.price_range_high,
    };

    await base44.entities.RoofQuote.update(quoteId, updates);
    setQuote((prev) => ({ ...prev, ...updates }));
  };

  const generateRooferProposals = useCallback(async (info, totalEstimate, matType) => {
    // AI-generate 3 matched roofer profiles (economy, standard, premium)
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate 3 realistic roofing contractor proposals for a homeowner at ${quote?.address || "a residential address"}. 
The roof replacement estimate is $${totalEstimate?.toLocaleString()} for ${matType?.replace(/_/g, " ")} material.

Create 3 contractors:
1. "economy" tier: competitive price, solid quality, slightly lower rating
2. "standard" tier: mid-range price, popular choice, great rating  
3. "premium" tier: higher price, top-rated, most experienced

Each should have: company_name, contact_name, phone (format: (555) 555-XXXX), rating (4.0-5.0), reviews (50-500), specialty (material type and experience), and bid_price (economy: 5-10% below estimate, standard: at estimate, premium: 5-15% above estimate).`,
      response_json_schema: {
        type: "object",
        properties: {
          proposals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                tier: { type: "string" },
                company_name: { type: "string" },
                contact_name: { type: "string" },
                phone: { type: "string" },
                rating: { type: "number" },
                reviews: { type: "number" },
                specialty: { type: "string" },
                bid_price: { type: "number" }
              }
            }
          }
        }
      }
    });
    return result.proposals || [];
  }, [quote]);

  const handleContactSubmit = async (info) => {
    setIsSubmitting(true);
    setContactInfo(info);

    await base44.entities.RoofQuote.update(quoteId, {
      homeowner_name: info.name,
      homeowner_email: info.email,
      homeowner_phone: info.phone,
      status: "lead_sent",
    });

    setIsSubmitting(false);
    setIsMatchingRoofers(true);

    // Generate 3 roofer proposals
    const rawProposals = await generateRooferProposals(info, quote.estimated_total, materialType);

    // Create Lead records for each
    const createdProposals = await Promise.all(
      rawProposals.map((p, i) =>
        base44.entities.Lead.create({
          quote_id: quoteId,
          homeowner_name: info.name,
          homeowner_email: info.email,
          homeowner_phone: info.phone,
          address: quote.address,
          estimated_total: quote.estimated_total,
          material_type: materialType,
          roof_area_sqft: quote.roof_analysis?.total_area_sqft,
          status: "new",
          tier: p.tier,
          roofer_bid: p.bid_price,
          roofer_name: p.contact_name,
          roofer_company: p.company_name,
          roofer_phone: p.phone,
          roofer_rating: p.rating,
          roofer_reviews: p.reviews,
          roofer_specialty: p.specialty,
        })
      )
    );

    setProposals(createdProposals);
    setIsMatchingRoofers(false);
    toast.success("Matched with 3 local roofers!");
  };

  const handleSelectRoofer = async (proposal) => {
    setIsSelecting(true);

    // Create a Project record
    const defaultMilestones = [
      { title: "Contract Signed", description: "Review and sign the project contract", status: "complete", completed_date: new Date().toLocaleDateString(), payment_amount: 0, payment_status: "paid" },
      { title: "Materials Ordered", description: "Contractor orders all necessary materials", status: "pending", payment_amount: Math.round(proposal.roofer_bid * 0.3), payment_status: "unpaid" },
      { title: "Old Roof Tear-Off", description: "Remove existing roofing materials", status: "pending", payment_amount: 0, payment_status: "unpaid" },
      { title: "New Roof Installation", description: "Install new roofing system", status: "pending", payment_amount: Math.round(proposal.roofer_bid * 0.5), payment_status: "unpaid" },
      { title: "Final Inspection & Cleanup", description: "Inspection, punch list, and site cleanup", status: "pending", payment_amount: Math.round(proposal.roofer_bid * 0.2), payment_status: "unpaid" },
    ];

    const proj = await base44.entities.Project.create({
      lead_id: proposal.id,
      quote_id: quoteId,
      homeowner_name: contactInfo?.name,
      homeowner_email: contactInfo?.email,
      homeowner_phone: contactInfo?.phone,
      roofer_company: proposal.roofer_company,
      roofer_name: proposal.roofer_name,
      roofer_phone: proposal.roofer_phone,
      address: quote.address,
      material_type: materialType,
      contract_amount: proposal.roofer_bid,
      amount_paid: 0,
      status: "scheduled",
      milestones: defaultMilestones,
      messages: [],
      payment_transactions: [],
    });

    // Mark this lead as accepted
    await base44.entities.Lead.update(proposal.id, { status: "accepted", homeowner_selected: true });

    // Send confirmation email
    if (contactInfo?.email) {
      await base44.integrations.Core.SendEmail({
        to: contactInfo.email,
        subject: "Your Roofing Project is Confirmed!",
        body: `Hi ${contactInfo?.name},\n\nGreat news! You've selected ${proposal.roofer_company} for your roof replacement at ${quote.address}.\n\nProject total: $${proposal.roofer_bid?.toLocaleString()}\n\nYou can track your project progress at any time.\n\nBest,\nRoofQuote AI Team`,
      });
    }

    setProjectId(proj.id);
    setIsSelecting(false);
    setIsComplete(true);
    toast.success("Roofer selected! Your project has been created.");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AnalyzingOverlay isActive={isAnalyzing} />

      {!isAnalyzing && quote && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(createPageUrl("Home"))}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Your Roof Estimate</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-sm text-slate-500">{quote.address}</p>
              </div>
            </div>
          </div>

          {isComplete ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border-2 border-emerald-200 rounded-3xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Project Created!</h2>
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                Your roofing project is confirmed. Track progress, make payments, and message your roofer — all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => navigate(createPageUrl("ProjectView") + `?id=${projectId}&role=homeowner`)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  View My Project
                </Button>
                <Button variant="outline" onClick={() => navigate(createPageUrl("Home"))}>
                  Get Another Quote
                </Button>
              </div>
            </motion.div>
          ) : isMatchingRoofers ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">Matching You with Roofers…</h3>
              <p className="text-sm text-slate-400">Finding the best local contractors for your project</p>
            </div>
          ) : proposals.length > 0 ? (
            <div className="space-y-6">
              <RooferProposals proposals={proposals} onSelect={handleSelectRoofer} isSelecting={isSelecting} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Satellite + Roof Area Editor */}
              <RoofAreaEditor
                address={quote.address}
                sections={roofSections}
                onSectionsChange={handleSectionsChange}
              />

              {/* Property Details (optional, improves analysis) */}
              <PropertyDetailsForm value={propertyDetails} onChange={setPropertyDetails} />

              {/* Current Material Detection */}
              {quote.roof_analysis?.current_material_label && (
                <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-lg">🏠</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Detected Current Roof Material</p>
                    <p className="text-sm font-semibold text-slate-800">{quote.roof_analysis.current_material_label}</p>
                  </div>
                </div>
              )}

              {/* Roof Report (editable) — with AI suggestions inside */}
              <RoofReport
                analysis={quote.roof_analysis}
                onSave={handleAnalysisEdit}
                aiSuggestions={quote.roof_analysis?.ai_suggestions}
              />

              {/* Replacement Roofing Material */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <MaterialTypeSelector value={materialType} onChange={handleMaterialChange} />
              </div>

              {/* Materials List */}
              <MaterialsList materials={quote.materials_list} />

              {/* Price Estimate — at bottom of report */}
              <PriceEstimate
                materialsCost={quote.materials_cost}
                laborCost={quote.labor_cost}
                total={quote.estimated_total}
                priceRangeLow={quote.price_range_low}
                priceRangeHigh={quote.price_range_high}
                materialType={materialType}
              />

              {/* Contact Form */}
              <ContactForm onSubmit={(info) => handleContactSubmit({ ...info, payment_type: paymentType })} isLoading={isSubmitting} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}