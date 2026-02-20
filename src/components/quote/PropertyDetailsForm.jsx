import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, ChevronDown, ChevronUp } from "lucide-react";

export default function PropertyDetailsForm({ value, onChange }) {
  const [open, setOpen] = useState(false);

  const update = (field, val) => onChange({ ...value, [field]: val });

  return (
    <Card className="border-slate-200">
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-slate-800">Additional Property Details</span>
          <span className="text-xs text-slate-400 ml-1">(optional — improves accuracy)</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <CardContent className="pt-0 space-y-4 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">Approximate Roof Age</Label>
              <Select value={value?.roof_age || ""} onValueChange={(v) => update("roof_age", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select age..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under_5">Under 5 years</SelectItem>
                  <SelectItem value="5_10">5–10 years</SelectItem>
                  <SelectItem value="10_15">10–15 years</SelectItem>
                  <SelectItem value="15_20">15–20 years</SelectItem>
                  <SelectItem value="20_plus">20+ years</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">Home Square Footage (living area)</Label>
              <Input
                type="number"
                placeholder="e.g. 2200"
                value={value?.home_sqft || ""}
                onChange={(e) => update("home_sqft", e.target.value)}
                className="h-9"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">Known Issues or Concerns</Label>
              <Input
                placeholder="e.g. leaking, missing shingles, storm damage"
                value={value?.concerns || ""}
                onChange={(e) => update("concerns", e.target.value)}
                className="h-9"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">Desired Upgrades or Add-ons</Label>
              <Input
                placeholder="e.g. solar-ready, improved ventilation, gutters"
                value={value?.upgrades || ""}
                onChange={(e) => update("upgrades", e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}