import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AnalyzingOverlay from "@/components/quote/AnalyzingOverlay";
import RoofAnalysisCard from "@/components/quote/RoofAnalysisCard";
import MaterialsList from "@/components/quote/MaterialsList";
import PriceEstimate from "@/components/quote/PriceEstimate";
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
      prompt: `You are a professional roofing estimator with 20+ years of field experience. You have access to satellite imagery and public property records. Analyze this SPECIFIC property and produce a highly accurate, detailed roof measurement and condition report.

Property Address: "${quoteData.address}"
Satellite/aerial view: ${satelliteUrl}
${detailsContext ? `\nHomeowner-provided details:\n${detailsContext}` : ""}

CRITICAL INSTRUCTIONS — READ CAREFULLY:
You MUST use your internet access to look up this exact address. Do NOT make up generic numbers. Every measurement must be grounded in real data.

STEP 1 — DEEP PROPERTY RESEARCH:
Search for this address specifically:
- Pull public records: county assessor, Zillow, Redfin, Google Maps, Bing Maps satellite view
- Find: year built, living area (sq ft), lot size, number of stories, building footprint
- Look at satellite imagery to identify: roof shape (gable/hip/gambrel/flat/mansard), number of distinct roof planes, visible penetrations
- Research local weather: snowload, wind zone, hurricane risk, hail frequency — all affect material recommendations
- If it's a subdivision, research the typical home model for that neighborhood/era

STEP 2 — PRECISE ROOF AREA CALCULATION (show your work):
Use the actual footprint from records. NEVER estimate below 900 sq ft for a single-family home.

Pitch multipliers:
  2/12=1.028 | 3/12=1.054 | 4/12=1.068 | 5/12=1.083 | 6/12=1.118 | 7/12=1.158 | 8/12=1.202 | 9/12=1.250 | 10/12=1.302 | 12/12=1.414

Steps:
1. footprint_sqft = living_area / stories (or from records)
2. overhang_area = perimeter × (overhang_inches/12) — typical 12–24" overhang
3. gross_deck = footprint_sqft + overhang_area
4. sloped_area = gross_deck × pitch_multiplier
5. total_area_sqft = sloped_area × waste_factor (simple=1.08, moderate=1.12, complex=1.15)

${extraDetails.home_sqft
  ? `Homeowner confirmed living area = ${extraDetails.home_sqft} sq ft. Use this as your footprint base.`
  : `Use public records for footprint. Cross-check with Zillow/assessor data.`}

STEP 3 — SATELLITE VISUAL INSPECTION:
Examine the satellite image carefully. Look for and count:
- Chimneys (brick/metal flue caps)
- Plumbing vent pipes (small 3–6" round protrusions, often 2–4 per house)
- Skylights (rectangular glass panels, often 1–4 on newer homes)
- HVAC curbs or units
- Solar panels (rectangular arrays)
- Ridge vents (continuous cap along ridge)
- Box/turtle vents (small rectangular raised vents)
- Satellite dishes
- Trees overhanging the roof (access difficulty)
- Neighbor proximity / tight access

STEP 4 — ROOF CONDITION ASSESSMENT:
From satellite and any available street view data, assess:
- Color uniformity (patchy = aging/storm damage)
- Moss/algae/lichen (dark streaking, especially north-facing slopes)
- Missing or lifted shingles (visible gaps or raised edges)
- Sagging or uneven ridgeline
- Flashing condition around penetrations
- Gutters/fascia condition
- Estimate age if not from records

STEP 5 — DIFFICULTY SCORE (1–10):
Factor in:
- Pitch: ≤3/12=easy(+0), 4–6/12=moderate(+2), 7–9/12=steep(+4), ≥10/12=very steep(+6)
- Stories: 1=+0, 2=+2, 3+=+4
- Complexity: simple=+0, moderate=+2, complex=+4
- Obstacles per 5: +1 each group
- Poor access (trees/tight lot): +1–2

STEP 6 — PER-SECTION BREAKDOWN:
roof_sections MUST:
- Sum exactly to total_area_sqft
- Use compass/directional names: "Front (South) Slope", "Back (North) Slope", "Left (West) Hip", "Right (East) Hip", "Garage Roof", etc.
- Include individual pitch per section if different slopes are visible

Return ALL of the following fields with real, researched values:
- total_area_sqft (number, calculated step-by-step)
- pitch (string, e.g. "6/12"), pitch_multiplier, overhang_inches, waste_factor
- footprint_sqft (number — the raw footprint before pitch/overhang)
- difficulty_score (1–10), difficulty_factors (detailed string array)
- num_facets, num_peaks, num_valleys, num_hips
- ridge_length_ft, eave_length_ft, rake_length_ft, valley_length_ft
- obstacles: [{type, count}] — list every identifiable penetration; empty array only if truly none visible
- condition_notes (detailed string — describe what you see on the satellite image)
- estimated_remaining_life_years (number)
- complexity ("simple"|"moderate"|"complex")
- stories (number), current_material (string), current_material_label (string)
- roof_sections: [{name, area_sqft, pitch}]
- ai_suggestions: 3 specific, actionable tips for THIS property/climate (not generic advice)`,
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

              {/* Roof Report (editable) */}
              <RoofReport
                analysis={quote.roof_analysis}
                onSave={handleAnalysisEdit}
              />

              {/* Contact Form — directly below the report */}
              <ContactForm onSubmit={(info) => handleContactSubmit({ ...info, payment_type: paymentType })} isLoading={isSubmitting} />

              {/* Materials List */}
              <MaterialsList materials={quote.materials_list} />

              {/* Price Estimate */}
              <PriceEstimate
                materialsCost={quote.materials_cost}
                laborCost={quote.labor_cost}
                total={quote.estimated_total}
                priceRangeLow={quote.price_range_low}
                priceRangeHigh={quote.price_range_high}
                materialType={materialType}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}