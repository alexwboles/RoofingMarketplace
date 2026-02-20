import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Satellite, Ruler, Mountain, BarChart3, CheckCircle2 } from "lucide-react";

const stages = [
  { icon: Satellite, text: "Locating satellite imagery...", duration: 2000 },
  { icon: Ruler, text: "Measuring roof area & dimensions...", duration: 3000 },
  { icon: Mountain, text: "Detecting peaks, valleys & slopes...", duration: 3000 },
  { icon: BarChart3, text: "Calculating materials & pricing...", duration: 2000 },
  { icon: CheckCircle2, text: "Quote ready!", duration: 1000 },
];

export default function AnalyzingOverlay({ isActive, onComplete }) {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setCurrentStage(0);
      return;
    }

    let timeout;
    const advance = (stage) => {
      if (stage < stages.length - 1) {
        timeout = setTimeout(() => {
          setCurrentStage(stage + 1);
          advance(stage + 1);
        }, stages[stage].duration);
      }
    };
    advance(0);

    return () => clearTimeout(timeout);
  }, [isActive]);

  if (!isActive) return null;

  const progress = ((currentStage + 1) / stages.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200">
            <Satellite className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Analyzing Your Roof</h3>
          <p className="text-sm text-slate-500 mt-1">Using satellite imagery & AI</p>
        </div>

        <div className="space-y-3 mb-8">
          {stages.map((stage, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: i <= currentStage ? 1 : 0.3, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300 ${
                i < currentStage
                  ? "bg-emerald-50 text-emerald-600"
                  : i === currentStage
                  ? "bg-amber-50 text-amber-600"
                  : "bg-slate-50 text-slate-300"
              }`}>
                {i < currentStage ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <stage.icon className={`w-4 h-4 ${i === currentStage ? "animate-pulse" : ""}`} />
                )}
              </div>
              <span className={`text-sm ${
                i <= currentStage ? "text-slate-700 font-medium" : "text-slate-400"
              }`}>
                {stage.text}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}