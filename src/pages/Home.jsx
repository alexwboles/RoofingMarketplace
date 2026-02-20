import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import HeroSection from "@/components/home/HeroSection";
import AddressInput from "@/components/home/AddressInput";
import HowItWorks from "@/components/home/HowItWorks";
import TrustSection from "@/components/home/TrustSection";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleAddressSubmit = async (address) => {
    setIsLoading(true);
    // Create initial quote record
    const quote = await base44.entities.RoofQuote.create({
      address,
      status: "analyzing",
    });
    navigate(createPageUrl("QuoteResult") + `?id=${quote.id}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <HeroSection>
        <AddressInput onSubmit={handleAddressSubmit} isLoading={isLoading} />
      </HeroSection>
      <HowItWorks />
      <TrustSection />

      {/* CTA for Roofers */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Are You a Roofer?</h2>
          <p className="text-slate-300 mb-8 max-w-lg mx-auto">
            Join our marketplace and receive pre-qualified leads with detailed roof measurements already done for you.
          </p>
          <a
            href={createPageUrl("RooferSignup")}
            className="inline-flex items-center px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20"
          >
            Sign Up as a Roofer
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-slate-950 text-center">
        <p className="text-sm text-slate-500">© 2026 RoofQuote AI. All rights reserved.</p>
      </footer>
    </div>
  );
}