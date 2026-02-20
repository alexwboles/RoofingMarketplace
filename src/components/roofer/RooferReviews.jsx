import React from "react";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

function Stars({ rating, size = "w-4 h-4" }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${size} ${n <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
      ))}
    </div>
  );
}

export default function RooferReviews({ reviews }) {
  if (!reviews?.length) {
    return <p className="text-sm text-slate-400 italic text-center py-6">No reviews yet.</p>;
  }

  const avg = (key) => {
    const vals = reviews.map((r) => r[key] || r.rating || 0).filter(Boolean);
    return vals.length ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : "—";
  };

  const overallAvg = avg("rating");

  const categories = [
    { label: "Quality", key: "quality_rating" },
    { label: "Communication", key: "communication_rating" },
    { label: "Timeliness", key: "timeliness_rating" },
    { label: "Value", key: "value_rating" },
  ];

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <Card className="border-amber-100 bg-amber-50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-4">
            <div className="text-center shrink-0">
              <p className="text-4xl font-extrabold text-amber-600">{overallAvg}</p>
              <Stars rating={parseFloat(overallAvg)} />
              <p className="text-xs text-slate-400 mt-1">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              {categories.map(({ label, key }) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-24 shrink-0">{label}</span>
                  <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(parseFloat(avg(key)) / 5) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-6 text-right">{avg(key)}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual reviews */}
      <div className="space-y-3">
        {reviews.map((r, i) => (
          <Card key={i} className="border-slate-100">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{r.homeowner_name || "Homeowner"}</p>
                  <Stars rating={r.rating} size="w-3.5 h-3.5" />
                </div>
                <span className="text-xs text-slate-400">
                  {r.created_date ? format(new Date(r.created_date), "MMM d, yyyy") : ""}
                </span>
              </div>
              {r.comment && <p className="text-sm text-slate-600 mt-2 leading-relaxed">{r.comment}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}