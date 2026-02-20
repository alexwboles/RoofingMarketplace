import React from "react";
import { motion } from "framer-motion";
import { Shield, Zap, Award } from "lucide-react";

const badges = [
  { icon: Zap, text: "Instant AI Quotes" },
  { icon: Shield, text: "Licensed Roofers" },
  { icon: Award, text: "Best Price Guarantee" },
];

export default function HeroSection({ children }) {
  return (
    <div className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800" />
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=1920&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-16 sm:pt-32 sm:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="flex justify-center gap-3 mb-8 flex-wrap">
            {badges.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-3.5 py-1.5"
              >
                <b.icon className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-medium text-white/90">{b.text}</span>
              </motion.div>
            ))}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
            Your New Roof,
            <br />
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Priced in Seconds
            </span>
          </h1>

          <p className="mt-4 text-2xl sm:text-3xl font-semibold text-amber-400 max-w-xl mx-auto">
            When roofers compete, homeowners win.
          </p>
          <p className="mt-3 text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            You could save 10%–25% vs. a single bid.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 max-w-2xl mx-auto"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}