import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Hammer, LayoutDashboard, Hammer as HammerIcon } from "lucide-react";

// Modern logo component
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

export default function Layout({ children, currentPageName }) {
  // Hide layout chrome on full-bleed pages (only Home page)
  const fullBleedPages = ["Home"];
  if (fullBleedPages.includes(currentPageName)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">Roofing<span className="text-amber-500">Marketplace</span></span>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              to={createPageUrl("Home")}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Home
            </Link>
            <Link
              to={createPageUrl("RooferDashboard")}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </Link>
            <Link
              to={createPageUrl("RooferSignup")}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <Hammer className="w-3.5 h-3.5" />
              For Roofers
            </Link>
          </div>
        </div>
      </nav>

      {children}
    </div>
  );
}