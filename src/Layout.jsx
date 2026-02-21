import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Hammer, LayoutDashboard, Hammer as HammerIcon, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import UnreadBadge from "@/components/messaging/UnreadBadge";

// Logo component
const Logo = () => (
  <div className="flex items-center gap-2">
    <Home className="w-6 h-6 text-amber-500" />
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
            <Logo />
          </Link>

          <div className="flex items-center gap-1">
            <Link
              to={createPageUrl("Home")}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Home
            </Link>
            <Link
              to={createPageUrl("HomeownerDashboard")}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Homeowner
            </Link>
            <Link
              to={createPageUrl("RooferDashboard")}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <HammerIcon className="w-3.5 h-3.5" />
              Roofer
            </Link>
          </div>
        </div>
      </nav>

      {children}
    </div>
  );
}