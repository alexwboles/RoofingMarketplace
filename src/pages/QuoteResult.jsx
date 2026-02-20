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
import SatelliteImageViewer from "@/components/quote/SatelliteImageViewer";
import RoofReport from "@/components/quote/RoofReport";
import RooferProposals from "@/components/quote/RooferProposals";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

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

  const urlParams = new URLSearchParams(window.location.search);
  const quoteId = urlParams.get("id");
  const navigate = useNavigate();

  const analyzeRoof = useCallback(async (quoteData) => {
    // Use AI to generate realistic roof analysis based on the address
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a roofing estimation AI. Given this residential address: "${quoteData.address}", generate a realistic and detailed roof analysis as if you analyzed satellite imagery. 
      
      Consider typical residential homes in this area. Generate realistic measurements. Be specific and varied - don't use round numbers.
      
      The analysis should include:
      - total_area_sqft (typical residential: 1200-3500 sq ft)
      - pitch (e.g. "4/12", "6/12", "8/12") 
      - num_facets (number of roof planes, typically 2-8)
      - num_peaks (typically 1-4)
      - num_valleys (typically 0-4)
      - num_hips (typically 0-6)
      - ridge_length_ft (total ridge length)
      - eave_length_ft (total eave/drip edge length)
      - rake_length_ft (total rake length)
      - valley_length_ft (total valley length)
      - obstacles: array of {type, count} - include things like skylights, vents, pipes, chimneys, satellite dishes
      - complexity: "simple", "moderate", or "complex"
      - stories: 1 or 2`,
      response_json_schema: {
        type: "object",
        properties: {
          total_area_sqft: { type: "number" },
          pitch: { type: "string" },
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
          stories: { type: "number" }
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
- Pitch: ${analysis.pitch}
- Facets: ${analysis.num_facets}
- Peaks: ${analysis.num_peaks}, Valleys: ${analysis.num_valleys}, Hips: ${analysis.num_hips}
- Ridge: ${analysis.ridge_length_ft} ft, Eave: ${analysis.eave_length_ft} ft
- Rake: ${analysis.rake_length_ft} ft, Valley: ${analysis.valley_length_ft} ft
- Obstacles: ${JSON.stringify(analysis.obstacles)}
- Complexity: ${analysis.complexity}
- Stories: ${analysis.stories}

Generate a realistic materials list with current 2026 pricing. Include all necessary items: shingles/roofing material, underlayment, ice & water shield, drip edge, ridge cap, flashing, pipe boots, nails, starter strip, hip & ridge shingles, ventilation, etc. Adjust quantities based on waste factor (typically 10-15%).

Also calculate total materials cost, estimated labor cost (varies by complexity and material), and total project estimate.`,
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
          estimated_total: { type: "number" }
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
        material_type: "architectural_shingle",
        status: "quoted",
      };

      await base44.entities.RoofQuote.update(quoteId, updatedQuote);

      setQuote({ ...quoteData, ...updatedQuote });
      // Small delay to let animation finish
      setTimeout(() => setIsAnalyzing(false), 1500);
    };

    loadAndAnalyze();
  }, [quoteId, analyzeRoof, generateMaterialsAndPricing]);

  const handleAnalysisEdit = async (updatedAnalysis) => {
    // Regenerate pricing based on edited roof measurements
    const pricing = await generateMaterialsAndPricing(updatedAnalysis, materialType);
    const updates = {
      roof_analysis: updatedAnalysis,
      materials_list: pricing.materials,
      materials_cost: pricing.materials_cost,
      labor_cost: pricing.labor_cost,
      estimated_total: pricing.estimated_total,
    };
    await base44.entities.RoofQuote.update(quoteId, updates);
    setQuote((prev) => ({ ...prev, ...updates }));
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

          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border-2 border-emerald-200 rounded-3xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Quote Sent!</h2>
              <p className="text-slate-500 max-w-md mx-auto">
                Local roofers have been notified. Expect to hear from 2-5 qualified contractors within 24 hours.
              </p>
              <Button
                onClick={() => navigate(createPageUrl("Home"))}
                className="mt-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                Get Another Quote
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Satellite Image */}
              <SatelliteImageViewer address={quote.address} />

              {/* Price Estimate */}
              <PriceEstimate
                materialsCost={quote.materials_cost}
                laborCost={quote.labor_cost}
                total={quote.estimated_total}
                materialType={materialType}
              />

              {/* Material Selector */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <MaterialTypeSelector value={materialType} onChange={handleMaterialChange} />
              </div>

              {/* Roof Report (editable) */}
              <RoofReport analysis={quote.roof_analysis} onSave={handleAnalysisEdit} />

              {/* Materials List */}
              <MaterialsList materials={quote.materials_list} />

              {/* Contact Form */}
              <ContactForm onSubmit={handleContactSubmit} isLoading={isSubmitting} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}