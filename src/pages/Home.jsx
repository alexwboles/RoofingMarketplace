import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import HeroSection from "@/components/home/HeroSection";
import AddressInput from "@/components/home/AddressInput";
import HowItWorks from "@/components/home/HowItWorks";
import TrustSection from "@/components/home/TrustSection";
import { LayoutDashboard, Hammer as HammerIcon } from "lucide-react";

// Modern logo
const Logo = () => (
  <div className="flex items-center gap-2">
    <div className="relative w-8 h-8">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg" />
      <svg
        viewBox="0 0 24 24"
        className="w-8 h-8 text-white relative z-10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path d="M3 12h18M12 3v18M7 8l10 8M7 16l10-8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <span className="font-bold text-slate-900">Roofing<span className="text-amber-500">Marketplace</span></span>
  </div>
);

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
        <p className="text-sm text-slate-500">© 2026 Roofing Marketplace. All rights reserved.</p>
      </footer>
    </div>
  );
}