import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, Loader2, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";

export default function PhotoGallery({ project, onUpdate, isRoofer }) {
  const [uploading, setUploading] = useState(null); // "before" | "after" | null
  const beforePhotos = project.before_photos || [];
  const afterPhotos = project.after_photos || [];

  const handleUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(type);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const key = type === "before" ? "before_photos" : "after_photos";
    const current = project[key] || [];
    await onUpdate({ [key]: [...current, file_url] });
    setUploading(null);
    toast.success(`${type === "before" ? "Before" : "After"} photo uploaded!`);
  };

  const handleRemove = async (url, type) => {
    const key = type === "before" ? "before_photos" : "after_photos";
    const updated = (project[key] || []).filter(u => u !== url);
    await onUpdate({ [key]: updated });
  };

  const PhotoSection = ({ title, photos, type, color }) => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${color}`} />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <span className="text-xs text-slate-400">({photos.length})</span>
        </div>
        {isRoofer && (
          <label className={`cursor-pointer inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
            uploading === type ? "opacity-50 pointer-events-none" : "hover:bg-slate-50 border-slate-200 text-slate-600"
          }`}>
            {uploading === type ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Upload
            <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, type)} />
          </label>
        )}
      </div>

      {photos.length === 0 ? (
        <div className="flex items-center justify-center h-24 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <div className="text-center">
            <ImageIcon className="w-5 h-5 text-slate-300 mx-auto mb-1" />
            <p className="text-xs text-slate-400">{isRoofer ? "No photos yet — upload above" : "No photos uploaded yet"}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {photos.map((url, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden aspect-video bg-slate-100">
              <img src={url} alt={`${title} ${i + 1}`} className="w-full h-full object-cover" />
              {isRoofer && (
                <button
                  onClick={() => handleRemove(url, type)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              )}
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/10 transition-opacity" />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardContent className="pt-5 space-y-6">
        <div className="flex items-center gap-2 mb-1">
          <Camera className="w-4 h-4 text-slate-400" />
          <p className="text-sm font-semibold text-slate-700">Before & After Photos</p>
        </div>
        <PhotoSection title="Before" photos={beforePhotos} type="before" color="bg-amber-400" />
        <PhotoSection title="After" photos={afterPhotos} type="after" color="bg-emerald-400" />
      </CardContent>
    </Card>
  );
}