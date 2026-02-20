import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

function StarPicker({ value, onChange, size = "w-6 h-6" }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} cursor-pointer transition-colors ${n <= (hover || value) ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
        />
      ))}
    </div>
  );
}

export default function ReviewForm({ project, onSubmitted }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [quality, setQuality] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [timeliness, setTimeliness] = useState(0);
  const [value, setValue] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = async () => {
    if (!rating) { toast.error("Please select an overall rating"); return; }
    setLoading(true);
    await base44.entities.Review.create({
      project_id: project.id,
      roofer_id: project.roofer_id,
      roofer_company: project.roofer_company,
      homeowner_name: project.homeowner_name,
      homeowner_email: project.homeowner_email,
      rating,
      quality_rating: quality || rating,
      communication_rating: communication || rating,
      timeliness_rating: timeliness || rating,
      value_rating: value || rating,
      comment,
    });
    setLoading(false);
    setSubmitted(true);
    toast.success("Review submitted! Thank you.");
    if (onSubmitted) onSubmitted();
  };

  if (submitted) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="pt-5 text-center py-8">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="font-semibold text-emerald-800">Review Submitted!</p>
          <p className="text-sm text-emerald-600 mt-1">Thank you for helping other homeowners.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200">
      <CardContent className="pt-5 space-y-5">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Rate Your Experience with {project.roofer_company}</p>
          <div className="flex items-center gap-3">
            <StarPicker value={rating} onChange={setRating} size="w-8 h-8" />
            {rating > 0 && <span className="text-sm font-semibold text-slate-700">{["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Quality of Work", val: quality, set: setQuality },
            { label: "Communication", val: communication, set: setCommunication },
            { label: "Timeliness", val: timeliness, set: setTimeliness },
            { label: "Value for Money", val: value, set: setValue },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <p className="text-xs text-slate-500 mb-1.5">{label}</p>
              <StarPicker value={val} onChange={set} size="w-5 h-5" />
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs text-slate-500 mb-1.5">Comments (optional)</p>
          <Textarea
            placeholder="Share your experience to help other homeowners..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="h-24 text-sm resize-none"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading || !rating}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white"
        >
          {loading ? "Submitting…" : "Submit Review"}
        </Button>
      </CardContent>
    </Card>
  );
}