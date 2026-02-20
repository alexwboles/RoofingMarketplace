import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Upload, Loader2 } from 'lucide-react';

export default function DocumentVerification({ roofer_id, onVerificationComplete }) {
  const [licenseFile, setLicenseFile] = useState(null);
  const [insuranceFile, setInsuranceFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileUpload = async (file) => {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!licenseFile || !insuranceFile) {
      alert('Please upload both license and insurance documents');
      return;
    }

    setLoading(true);
    try {
      const licenseUrl = await handleFileUpload(licenseFile);
      const insuranceUrl = await handleFileUpload(insuranceFile);

      const response = await base44.functions.invoke('verifyRooferDocuments', {
        roofer_id,
        license_url: licenseUrl,
        insurance_url: insuranceUrl
      });

      setResult(response.data);
      if (response.data.success && response.data.verification_status === 'verified') {
        setTimeout(() => onVerificationComplete?.(), 1500);
      }
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Verification</CardTitle>
        <CardDescription>
          Upload your roofing license and insurance certificate for verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* License Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Roofing License</label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-slate-400 transition-colors">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setLicenseFile(e.target.files?.[0])}
              className="hidden"
              id="license-input"
            />
            <label htmlFor="license-input" className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="w-6 h-6 text-slate-400" />
              <span className="text-sm text-slate-600">
                {licenseFile ? licenseFile.name : 'Click to upload or drag and drop'}
              </span>
              <span className="text-xs text-slate-500">PDF or image (PNG, JPG)</span>
            </label>
          </div>
        </div>

        {/* Insurance Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Insurance Certificate</label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-slate-400 transition-colors">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setInsuranceFile(e.target.files?.[0])}
              className="hidden"
              id="insurance-input"
            />
            <label htmlFor="insurance-input" className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="w-6 h-6 text-slate-400" />
              <span className="text-sm text-slate-600">
                {insuranceFile ? insuranceFile.name : 'Click to upload or drag and drop'}
              </span>
              <span className="text-xs text-slate-500">PDF or image (PNG, JPG)</span>
            </label>
          </div>
        </div>

        {/* Verification Result */}
        {result && (
          <div className="space-y-3">
            {result.success && result.verification_status === 'verified' ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <div>
                  <h4 className="font-semibold text-green-900">Documents Verified</h4>
                  <p className="text-sm text-green-800">
                    Your license and insurance have been successfully verified.
                  </p>
                </div>
              </Alert>
            ) : result.error ? (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <div>
                  <h4 className="font-semibold text-red-900">Verification Failed</h4>
                  <p className="text-sm text-red-800">{result.error}</p>
                </div>
              </Alert>
            ) : (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <div>
                  <h4 className="font-semibold text-yellow-900">Resubmission Needed</h4>
                  <p className="text-sm text-yellow-800">{result.notes}</p>
                </div>
              </Alert>
            )}
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!licenseFile || !insuranceFile || loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Verifying Documents...
            </>
          ) : (
            'Verify Documents'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}