import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Edit2, Check, X, PenLine, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const generateContractText = (project) => {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  return `ROOFING SERVICES CONTRACT

Date: ${today}

PARTIES
This Roofing Services Contract ("Contract") is entered into between:

Contractor: ${project.roofer_company || "[Roofer Company]"}
Representative: ${project.roofer_name || "[Roofer Name]"}
Phone: ${project.roofer_phone || "[Roofer Phone]"}

Homeowner: ${project.homeowner_name || "[Homeowner Name]"}
Email: ${project.homeowner_email || "[Homeowner Email]"}
Phone: ${project.homeowner_phone || "[Homeowner Phone]"}

PROJECT ADDRESS
${project.address}

SCOPE OF WORK
The Contractor agrees to perform the following roofing services at the above property:
- Complete removal and disposal of existing roofing materials
- Installation of new ${(project.material_type || "roofing material").replace(/_/g, " ")} roofing system
- Installation of underlayment and ice/water shield where applicable
- Replacement of all roof flashing as needed
- Inspection and repair of any damaged roof decking discovered during installation
- Clean-up and removal of all project-related debris upon completion
- Final inspection and walkthrough with homeowner

CONTRACT AMOUNT
Total Contract Price: $${project.contract_amount?.toLocaleString() || "0"}
Payment Schedule: As outlined in the project milestones.

PROJECT TIMELINE
Estimated Start Date: ${project.start_date || "To be determined"}
Estimated Completion Date: ${project.estimated_completion || "To be determined"}

WARRANTY
The Contractor warrants all labor and workmanship for a period of one (1) year from the date of project completion. Manufacturer warranties on materials are passed through to the homeowner.

TERMS AND CONDITIONS
1. The Contractor shall obtain all necessary permits required for this project.
2. Any additional work discovered to be necessary beyond the original scope will be discussed with the Homeowner prior to commencement, and a change order will be required.
3. The Contractor shall maintain general liability insurance and workers' compensation coverage throughout the project.
4. The Homeowner agrees to provide reasonable access to the property for the duration of the project.
5. This Contract constitutes the entire agreement between the parties and supersedes all prior discussions.

SIGNATURES
By signing below, both parties agree to the terms and conditions outlined in this Contract.

Contractor Signature: _________________________ Date: _____________
${project.roofer_name || "[Roofer Name]"}, ${project.roofer_company || "[Company]"}

Homeowner Signature: _________________________ Date: _____________
${project.homeowner_name || "[Homeowner Name]"}`;
};

export default function ProjectContract({ project, isRoofer, onSave }) {
  const [contract, setContract] = useState(project.contract || null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [signing, setSigning] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (project.contract) setContract(project.contract);
  }, [project.contract]);

  const handleGenerate = async () => {
    setGenerating(true);
    const text = generateContractText(project);
    const newContract = {
      text,
      generated_date: new Date().toISOString(),
      roofer_signed: false,
      homeowner_signed: false,
      roofer_signed_date: null,
      homeowner_signed_date: null,
    };
    await onSave({ contract: newContract });
    setContract(newContract);
    setGenerating(false);
    toast.success("Contract generated!");
  };

  const handleStartEdit = () => {
    setEditText(contract.text);
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    const updated = { ...contract, text: editText };
    // Reset signatures when contract is edited
    updated.roofer_signed = false;
    updated.homeowner_signed = false;
    updated.roofer_signed_date = null;
    updated.homeowner_signed_date = null;
    await onSave({ contract: updated });
    setContract(updated);
    setEditing(false);
    toast.success("Contract updated. Signatures have been reset.");
  };

  const handleSign = async () => {
    setSigning(true);
    const updated = { ...contract };
    if (isRoofer) {
      updated.roofer_signed = true;
      updated.roofer_signed_date = new Date().toISOString();
    } else {
      updated.homeowner_signed = true;
      updated.homeowner_signed_date = new Date().toISOString();
    }
    await onSave({ contract: updated });
    setContract(updated);
    setSigning(false);
    toast.success("Contract signed successfully!");
  };

  const handleDownload = () => {
    const blob = new Blob([contract.text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contract_${project.address?.replace(/\s+/g, "_") || "project"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const alreadySigned = isRoofer ? contract?.roofer_signed : contract?.homeowner_signed;
  const bothSigned = contract?.roofer_signed && contract?.homeowner_signed;

  if (!contract) {
    return (
      <Card>
        <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
            <FileText className="w-7 h-7 text-slate-400" />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-800 mb-1">No Contract Yet</p>
            <p className="text-sm text-slate-400 max-w-xs">
              {isRoofer
                ? "Generate an auto-filled contract based on project details. You and the homeowner can then review and sign it."
                : "Your roofer hasn't generated the contract yet. Check back soon."}
            </p>
          </div>
          {isRoofer && (
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
              Generate Contract
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-slate-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-slate-400" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Project Contract</p>
            <p className="text-xs text-slate-400">
              Generated {new Date(contract.generated_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={contract.roofer_signed ? "bg-emerald-50 text-emerald-700 border-emerald-200 border" : "bg-slate-50 text-slate-500 border-slate-200 border"}>
            {contract.roofer_signed ? "✓ Roofer Signed" : "Roofer: Unsigned"}
          </Badge>
          <Badge className={contract.homeowner_signed ? "bg-emerald-50 text-emerald-700 border-emerald-200 border" : "bg-slate-50 text-slate-500 border-slate-200 border"}>
            {contract.homeowner_signed ? "✓ Homeowner Signed" : "Homeowner: Unsigned"}
          </Badge>
          {bothSigned && (
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 border">✓ Fully Executed</Badge>
          )}
        </div>
      </div>

      {/* Contract text */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contract Terms</p>
            <div className="flex gap-2">
              {isRoofer && !editing && (
                <>
                  <Button size="sm" variant="outline" onClick={handleGenerate} disabled={generating} className="h-7 text-xs">
                    <RefreshCw className="w-3 h-3 mr-1" /> Regenerate
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleStartEdit} className="h-7 text-xs">
                    <Edit2 className="w-3 h-3 mr-1" /> Edit
                  </Button>
                </>
              )}
              {editing && (
                <>
                  <Button size="sm" onClick={handleSaveEdit} className="h-7 text-xs bg-green-600 hover:bg-green-700">
                    <Check className="w-3 h-3 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="h-7 text-xs">
                    <X className="w-3 h-3 mr-1" /> Cancel
                  </Button>
                </>
              )}
            </div>
          </div>

          {editing ? (
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full h-96 text-sm font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-4 resize-y focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono leading-relaxed bg-slate-50 rounded-lg p-4 max-h-96 overflow-y-auto border border-slate-100">
              {contract.text}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* Sign / Download actions */}
      {!editing && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-slate-100 px-4 py-4">
          <div>
            {alreadySigned ? (
              <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                You signed this contract on {new Date(isRoofer ? contract.roofer_signed_date : contract.homeowner_signed_date).toLocaleDateString()}
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                {bothSigned ? "Both parties have signed." : "Review the contract above, then sign below."}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleDownload} className="text-xs">
              Download
            </Button>
            {!alreadySigned && (
              <Button
                size="sm"
                onClick={handleSign}
                disabled={signing}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs"
              >
                {signing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <PenLine className="w-3.5 h-3.5 mr-1" />}
                Sign Contract
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}