import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AnalyzingOverlay from "@/components/quote/AnalyzingOverlay";
import MaterialsList from "@/components/quote/MaterialsList";
import PriceEstimate from "@/components/quote/PriceEstimate";
import QuoteSummary from "@/components/quote/QuoteSummary";
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

// Generate roof facet polygons that sit on top of the satellite roof footprint.
// At z=21 the roof occupies roughly the center 38% W × 34% H of the 640×360 canvas.
// We derive named-facet positions so each section lands on the correct part of the roof.
function generateRoofPolygon(i, total, sectionFraction, complexity, sectionName) {
  const W = 640, H = 360;
  const rW = W * 0.38;   // roof footprint width on canvas
  const rH = H * 0.34;   // roof footprint height on canvas
  const cx = W / 2 - 10; // slight left offset to compensate Google Maps UI
  const cy = H / 2 + 5;  // slight downward offset
  const x0 = cx - rW / 2, y0 = cy - rH / 2;
  const x1 = cx + rW / 2, y1 = cy + rH / 2;
  const ridge = cy; // horizontal ridge line through center

  // Try to position by section name keyword
  const name = (sectionName || "").toLowerCase();
  const isFront = /front|south|s[- ]|garage|main/.test(name);
  const isBack  = /back|rear|north|n[- ]/.test(name);
  const isLeft  = /left|west|w[- ]/.test(name);
  const isRight = /right|east|e[- ]/.test(name);
  const isGarage = /garage/.test(name);

  const cut = rH * 0.18; // hip cut size

  if (total === 1) {
    // Full hip/gable over entire footprint
    if (complexity === "simple") {
      return [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
    }
    return [
      { x: x0 + cut, y: y0 }, { x: x1 - cut, y: y0 },
      { x: x1, y: y0 + cut }, { x: x1, y: y1 - cut },
      { x: x1 - cut, y: y1 }, { x: x0 + cut, y: y1 },
      { x: x0, y: y1 - cut }, { x: x0, y: y0 + cut },
    ];
  }

  // 2-slope gable: front slope (bottom half) + back slope (top half)
  if (total === 2) {
    const isFrontFace = i === 0 || isFront;
    if (isFrontFace) {
      // Front slope: ridge at top, eave at bottom
      return [{ x: x0 + cut, y: ridge }, { x: x1 - cut, y: ridge }, { x: x1, y: y1 }, { x: x0, y: y1 }];
    } else {
      return [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1 - cut, y: ridge }, { x: x0 + cut, y: ridge }];
    }
  }

  // 4-slope hip roof: front, back, left end, right end
  if (total === 4) {
    const ridgeL = cx - rW * 0.28;
    const ridgeR = cx + rW * 0.28;
    if (isFront || i === 0) {
      return [{ x: ridgeL, y: ridge }, { x: ridgeR, y: ridge }, { x: x1, y: y1 }, { x: x0, y: y1 }];
    }
    if (isBack || i === 1) {
      return [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: ridgeR, y: ridge }, { x: ridgeL, y: ridge }];
    }
    if (isLeft || i === 2) {
      return [{ x: x0, y: y0 }, { x: ridgeL, y: ridge }, { x: x0, y: y1 }];
    }
    // right end
    return [{ x: x1, y: y0 }, { x: x1, y: y1 }, { x: ridgeR, y: ridge }];
  }

  // Garage or additional sections — place in a scaled sub-region
  if (isGarage) {
    const gx0 = x0, gy0 = cy, gx1 = cx - rW * 0.05, gy1 = y1;
    return [{ x: gx0, y: gy0 }, { x: gx1, y: gy0 }, { x: gx1, y: gy1 }, { x: gx0, y: gy1 }];
  }

  // Generic fallback: tile the roof footprint proportionally
  const cols = total <= 2 ? total : total <= 4 ? 2 : 3;
  const rows = Math.ceil(total / cols);
  const col = i % cols;
  const row = Math.floor(i / cols);
  const sw = rW / cols, sh = rH / rows;
  const gap = 3;
  const fx0 = x0 + col * sw + gap, fy0 = y0 + row * sh + gap;
  const fx1 = fx0 + sw - gap * 2, fy1 = fy0 + sh - gap * 2;
  const scale = Math.sqrt(sectionFraction || 1);
  const mx = (fx0 + fx1) / 2, my = (fy0 + fy1) / 2;
  return [
    { x: mx - (mx - fx0) * scale, y: fy0 },
    { x: mx + (fx1 - mx) * scale, y: fy0 },
    { x: mx + (fx1 - mx) * scale, y: fy1 },
    { x: mx - (mx - fx0) * scale, y: fy1 },
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

  const getSatelliteImageUrl = (address) => {
    const encoded = encodeURIComponent(address);
    return `https://maps.googleapis.com/maps/api/staticmap?center=${encoded}&zoom=20&size=640x360&maptype=satellite&key=`;
    // We'll use the embed approach since no API key — store the Google Maps embed screenshot URL as reference
  };

  const analyzeRoof = useCallback(async (quoteData, extraDetails = {}) => {
    const detailsContext = [
      extraDetails.home_sqft ? `Living area square footage: ${extraDetails.home_sqft} sq ft` : "",
      extraDetails.roof_age ? `Roof age: ${extraDetails.roof_age.replace(/_/g, " ")}` : "",
      extraDetails.concerns ? `Known issues/concerns: ${extraDetails.concerns}` : "",
      extraDetails.upgrades ? `Desired upgrades/add-ons: ${extraDetails.upgrades}` : "",
    ].filter(Boolean).join("\n");

    // Build satellite image URL using Google's open satellite tile (no API key required for embed reference)
    const satelliteUrl = `https://maps.google.com/maps?q=${encodeURIComponent(quoteData.address)}&t=k&z=20`;

    const analysis = await base44.integrations.Core.InvokeLLM({
      add_context_from_internet: true,
      prompt: `You are an expert roofing estimator with extensive field experience. Analyze this property and provide precise roof measurements for cost estimation. ACCURACY IS CRITICAL - errors here directly impact the customer quote.

Property Address: "${quoteData.address}"
Satellite/aerial view: ${satelliteUrl}
${detailsContext ? `\nHomeowner-provided details:\n${detailsContext}` : ""}

CRITICAL: Use internet access to find real property data. Search county records, Zillow, Redfin, assessor databases for:
- Square footage of living area
- Number of stories
- Lot size and building footprint
- Year built and any recent permits

ROOF AREA CALCULATION (MUST be accurate):
1. Find the actual living area sq ft from public records (NOT a rough estimate)
2. Divide by number of stories to get roof footprint
3. Add typical overhang (18-24 inches on all sides = perimeter × 1.5-2 feet)
4. Apply pitch multiplier from this table based on satellite inspection:
   - 3/12: ×1.054 | 4/12: ×1.068 | 5/12: ×1.083 | 6/12: ×1.118 | 7/12: ×1.158 | 8/12: ×1.202
5. Apply waste factor: simple gable=1.08, 2-4 slopes=1.12, complex 5+=1.15

Example: 2,000 sq ft home, 1 story, 6/12 pitch, 24" overhang, 2-slope gable
- Footprint: 2,000 sq ft
- Perimeter-based overhang: ~200ft perimeter × 2ft = 400 sq ft
- Gross: 2,400 sq ft
- With pitch ×1.118: 2,683 sq ft
- With waste ×1.12: ~3,005 sq ft total
(NOT less than 2,500 sq ft for this scenario)

BREAKING DOWN INTO SECTIONS:
Identify distinct roof planes from the satellite image (front slope, back slope, hips, etc). Each section must be realistic (>150 sq ft minimum to avoid fragmentation). Sections must sum to your calculated total.

VALIDATION RULES:
- Minimum 900 sq ft for any home (NEVER go lower)
- For 1,500-2,500 sq ft homes, expect 1,800-3,500 sq ft roof area
- For 2,500-4,000 sq ft homes, expect 3,500-6,000 sq ft roof area
- If your calculation seems too low, increase pitch estimate or verify living area is not just ground floor

Return ONLY the following fields (all required):
- total_area_sqft (verified minimum 900)
- pitch (e.g. "6/12")
- pitch_multiplier (exact number)
- overhang_inches (default 18, increase if visible in satellite)
- waste_factor (1.08-1.15 based on complexity)
- difficulty_score (1-10)
- difficulty_factors (array of strings explaining score)
- num_facets, num_peaks, num_valleys, num_hips (from satellite observation)
- ridge_length_ft, eave_length_ft, rake_length_ft, valley_length_ft
- obstacles (array of visible items only: chimneys, vents, etc)
- condition_notes (what you see on the satellite)
- estimated_remaining_life_years
- complexity ("simple"|"moderate"|"complex")
- stories (number)
- current_material (string)
- current_material_label (string)
- roof_sections (array with name, area_sqft, pitch - MUST sum to total_area_sqft)
- ai_suggestions (3 actionable tips specific to THIS property)`,
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
          condition_notes: { type: "string" },
          estimated_remaining_life_years: { type: "number" },
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

    // Safety guard: ensure total_area_sqft is never unrealistically small
    if (analysis && analysis.total_area_sqft < 900) {
      const footprint = extraDetails.home_sqft ? parseInt(extraDetails.home_sqft) : 1500;
      const stories = analysis.stories || 1;
      const pitch_mult = analysis.pitch_multiplier || 1.118;
      const waste = analysis.waste_factor || 1.10;
      analysis.total_area_sqft = Math.round((footprint / stories) * 1.1 * pitch_mult * waste);
    }
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
            points: generateRoofPolygon(i, savedSections.length, total > 0 ? s.area_sqft / total : 1, quoteData.roof_analysis?.complexity, s.name),
          })));
        }
        setIsAnalyzing(false);
        return;
      }

      // Run analysis
      const analysis = await analyzeRoof(quoteData);

      // Generate materials and pricing
      const pricing = await generateMaterialsAndPricing(analysis, "architectural_shingle");

      // Validate and normalize roof_sections — filter for realistic values
      const validSections = (analysis.roof_sections || []).filter(s => s.area_sqft && s.area_sqft >= 200);
      if (validSections.length === 0 && analysis.total_area_sqft > 900) {
        // Fallback: create a single section if none exist
        validSections.push({
          name: "Full Roof",
          area_sqft: analysis.total_area_sqft,
          pitch: analysis.pitch
        });
      }

      // Use section sum as authoritative total (sections are more accurate)
      const sectionTotal = validSections.reduce((sum, s) => sum + (s.area_sqft || 0), 0);
      const accurateTotal = sectionTotal > 900 ? sectionTotal : analysis.total_area_sqft;

      // Update the quote
      const updatedQuote = {
        roof_analysis: {
          ...analysis,
          total_area_sqft: accurateTotal,
          roof_sections: validSections
        },
        materials_list: pricing.materials,
        materials_cost: pricing.materials_cost,
        labor_cost: pricing.labor_cost,
        estimated_total: pricing.estimated_total,
        price_range_low: pricing.price_range_low,
        price_range_high: pricing.price_range_high,
        material_type: "architectural_shingle",
        status: "quoted",
      };

      // Store satellite image URL on the quote for sharing with roofers
      const satelliteImageUrl = `https://maps.google.com/maps?q=${encodeURIComponent(quoteData.address)}&t=k&z=20`;
      updatedQuote.satellite_image_url = satelliteImageUrl;

      await base44.entities.RoofQuote.update(quoteId, updatedQuote);

      const secTotal = (analysis.roof_sections || []).reduce((sum, s) => sum + (s.area_sqft || 0), 0);
      const initialSections = (analysis.roof_sections || []).map((s, i) => ({
        name: s.name,
        area_sqft: s.area_sqft,
        color: i % 6,
        points: generateRoofPolygon(i, analysis.roof_sections.length, secTotal > 0 ? s.area_sqft / secTotal : 1, analysis.complexity, s.name),
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
          satellite_image_url: quote.satellite_image_url || `https://maps.google.com/maps?q=${encodeURIComponent(quote.address)}&t=k&z=20`,
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
        body: `Hi ${contactInfo?.name},\n\nGreat news! You've selected ${proposal.roofer_company} for your roof replacement at ${quote.address}.\n\nProject total: $${proposal.roofer_bid?.toLocaleString()}\n\nYou can track your project progress at any time.\n\nBest,\nRoofing Marketplace Team`,
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

               {/* Summary of key metrics — moved here */}
               <QuoteSummary analysis={quote.roof_analysis} />

               {/* Property Details (optional, improves analysis) */}
               <PropertyDetailsForm value={propertyDetails} onChange={setPropertyDetails} />

               {/* Contact Form — get your free quote */}
               <ContactForm onSubmit={(info) => handleContactSubmit({ ...info, payment_type: paymentType })} isLoading={isSubmitting} />

               {/* Price Estimate */}
               <PriceEstimate
                 materialsCost={quote.materials_cost}
                 laborCost={quote.labor_cost}
                 total={quote.estimated_total}
                 priceRangeLow={quote.price_range_low}
                 priceRangeHigh={quote.price_range_high}
                 materialType={materialType}
               />

              {/* Optional: Detailed breakdown sections (collapsed by default) */}
              <details className="group border border-slate-200 rounded-xl">
                <summary className="cursor-pointer px-6 py-4 font-semibold text-slate-900 hover:bg-slate-50 transition-colors">
                  View Full Analysis & Materials
                </summary>
                <div className="border-t border-slate-200 px-6 py-4 space-y-6">
                  <RoofReport
                    analysis={quote.roof_analysis}
                    onSave={handleAnalysisEdit}
                  />
                  <MaterialsList materials={quote.materials_list} />
                </div>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  );
}