import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ServiceAreaEditor({ roofer, onSave }) {
  const [serviceAreas, setServiceAreas] = useState(roofer?.service_areas || []);
  const [newZip, setNewZip] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleAddZip = () => {
    if (newZip.trim() && !serviceAreas.includes(newZip.toUpperCase())) {
      setServiceAreas([...serviceAreas, newZip.toUpperCase()]);
      setNewZip("");
    }
  };

  const handleRemoveZip = (zip) => {
    setServiceAreas(serviceAreas.filter((z) => z !== zip));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await base44.entities.Roofer.update(roofer.id, { service_areas: serviceAreas });
      toast.success("Service areas updated");
      onSave?.(serviceAreas);
    } catch (error) {
      toast.error("Failed to save service areas");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Service Areas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Add zip code (e.g., 90210)"
            value={newZip}
            onChange={(e) => setNewZip(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === "Enter" && handleAddZip()}
            maxLength="5"
            className="h-8"
          />
          <Button size="sm" onClick={handleAddZip} className="h-8">
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {serviceAreas.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">No service areas added yet</p>
          ) : (
            serviceAreas.map((zip) => (
              <Badge key={zip} variant="outline" className="flex items-center gap-1.5 text-xs pl-2.5 pr-1.5">
                {zip}
                <button onClick={() => handleRemoveZip(zip)} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))
          )}
        </div>

        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          size="sm" 
          className="w-full"
        >
          {isSaving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
          Save Service Areas
        </Button>
      </CardContent>
    </Card>
  );
}