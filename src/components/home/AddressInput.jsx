import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, MapPin, Loader2 } from "lucide-react";

export default function AddressInput({ onSubmit, isLoading }) {
  const [address, setAddress] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (address.trim()) onSubmit(address.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex flex-col sm:flex-row gap-3 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-2 sm:p-2">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-4">
          <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
          <Input
            type="text"
            placeholder="Enter your full address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 text-base h-12 bg-transparent placeholder:text-slate-400"
          />
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
      <p className="text-center text-xs text-slate-400 mt-3">
        Free estimate · No commitment · Takes 30 seconds
      </p>
    </form>
  );
}