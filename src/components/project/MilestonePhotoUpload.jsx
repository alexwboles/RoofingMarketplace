import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, Camera, ImageIcon } from "lucide-react";
import { toast } from "sonner";

export default function MilestonePhotoUpload({ milestone, milestoneIndex, project, onPhotosUpdated }) {
  const [uploading, setUploading] = useState(false);
  const photos = milestone.photos || [];

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);

    const uploaded = await Promise.all(
      files.map(file => base44.integrations.Core.UploadFile({ file }).then(r => r.file_url))
    );

    const updatedPhotos = [...photos, ...uploaded];
    await onPhotosUpdated(milestoneIndex, updatedPhotos);

    // Email homeowner notification
    if (project?.homeowner_email) {
      await base44.integrations.Core.SendEmail({
        to: project.homeowner_email,
        subject: `Progress Update: ${milestone.title}`,
        body: `Hi ${project.homeowner_name || "there"},\n\nYour contractor has uploaded ${uploaded.length} new progress photo${uploaded.length > 1 ? "s" : ""} for the milestone: "${milestone.title}" at ${project.address}.\n\nLog in to your project dashboard to view the latest updates.\n\nBest,\nRoofing Marketplace`,
      });
      toast.success(`${uploaded.length} photo${uploaded.length > 1 ? "s" : ""} uploaded & homeowner notified!`);
    } else {
      toast.success(`${uploaded.length} photo${uploaded.length > 1 ? "s" : ""} uploaded!`);
    }

    setUploading(false);
  };

  const handleRemove = async (url) => {
    const updatedPhotos = photos.filter(u => u !== url);
    await onPhotosUpdated(milestoneIndex, updatedPhotos);
  };

  return (
    <div className="mt-3 pt-3 border-t border-slate-200/70">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">Progress Photos</span>
          {photos.length > 0 && (
            <span className="text-[10px] text-slate-400">({photos.length})</span>
          )}
        </div>
        <label className={`cursor-pointer inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border transition-all ${
          uploading ? "opacity-50 pointer-events-none" : "hover:bg-white border-slate-300 text-slate-600 bg-white/60"
        }`}>
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          Upload
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map((url, i) => (
            <div key={i} className="relative group rounded-lg overflow-hidden aspect-video bg-slate-100">
              <img src={url} alt={`Progress ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => handleRemove(url)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-white" />
              </button>
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-14 bg-white/40 rounded-lg border border-dashed border-slate-200">
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" /> No photos yet
          </p>
        </div>
      )}
    </div>
  );
}