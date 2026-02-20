import React from "react";
import { motion } from "framer-motion";
import { MapPin, Satellite, FileText, Handshake } from "lucide-react";

const steps = [
  {
    icon: MapPin,
    title: "Enter Your Address",
    desc: "Type in your property address and we locate it via satellite.",
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    icon: Satellite,
    title: "AI Roof Analysis",
    desc: "Our AI measures your roof area, slopes, valleys, and obstacles.",
    color: "bg-violet-50 text-violet-600 border-violet-100",
  },
  {
    icon: FileText,
    title: "Instant Estimate",
    desc: "Get a detailed materials list and price estimate in seconds.",
    color: "bg-amber-50 text-amber-600 border-amber-100",
  },
  {
    icon: Handshake,
    title: "Connect with Roofers",
    desc: "Local licensed roofers compete for your project at the best price.",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-2">How It Works</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            From Address to Estimate in 4 Steps
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative group"
            >
              <div className="bg-white border border-slate-100 rounded-2xl p-6 h-full hover:shadow-lg hover:shadow-slate-100 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${step.color}`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-300 uppercase">Step {i + 1}</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}