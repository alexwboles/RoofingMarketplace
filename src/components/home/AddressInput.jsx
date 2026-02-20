import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, MapPin, Loader2 } from "lucide-react";

// Simple address autocomplete using the Nominatim (OpenStreetMap) API — no key required
export default function AddressInput({ onSubmit, isLoading }) {
  const [address, setAddress] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fetchingHint, setFetchingHint] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    setAddress(val);

    clearTimeout(debounceRef.current);
    if (val.length < 4) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setFetchingHint(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(val)}&countrycodes=us`
      );
      const data = await res.json();
      setSuggestions(data.map((item) => item.display_name));
      setShowSuggestions(true);
      setFetchingHint(false);
    }, 350);
  };

  const handleSelect = (suggestion) => {
    setAddress(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (address.trim()) onSubmit(address.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="relative" ref={wrapperRef}>
      <div className="flex flex-col sm:flex-row gap-3 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-2 sm:p-2">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-4 relative">
          <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
          <Input
            type="text"
            placeholder="Enter your full address..."
            value={address}
            onChange={handleChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            autoComplete="off"
            className="border-0 shadow-none focus-visible:ring-0 text-base h-12 bg-transparent placeholder:text-slate-400"
          />
          {fetchingHint && (
            <Loader2 className="w-4 h-4 text-slate-300 animate-spin shrink-0" />
          )}
        </div>
        <Button
          type="submit"
          disabled={!address.trim() || isLoading}
          className="h-12 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Get Instant Quote
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(s)}
              className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-amber-50 flex items-center gap-2 border-b border-slate-50 last:border-0 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <span className="line-clamp-1">{s}</span>
            </button>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-slate-400 mt-3">
        Free estimate · No commitment · Takes 30 seconds
      </p>
    </form>
  );
}