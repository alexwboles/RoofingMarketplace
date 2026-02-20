import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { roofer_id, license_url, insurance_url } = await req.json();

    if (!roofer_id || !license_url || !insurance_url) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify license document with LLM
    const licenseAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this roofing license document and extract the following information if visible:
- License number
- State
- Licensee name
- Expiration date
- License type/classification

If any information is unclear or the document doesn't appear to be a valid roofing license, note that in your response.

Return ONLY a JSON object with these exact fields (all optional if not found):
{
  "valid_license": boolean,
  "license_number": string or null,
  "state": string or null,
  "license_type": string or null,
  "expiry_date": string or null (YYYY-MM-DD format),
  "name": string or null,
  "issues": array of strings describing any problems or concerns
}`,
      file_urls: [license_url],
      response_json_schema: {
        type: "object",
        properties: {
          valid_license: { type: "boolean" },
          license_number: { type: ["string", "null"] },
          state: { type: ["string", "null"] },
          license_type: { type: ["string", "null"] },
          expiry_date: { type: ["string", "null"] },
          name: { type: ["string", "null"] },
          issues: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Verify insurance document with LLM
    const insuranceAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this insurance certificate and extract the following information if visible:
- Insurance provider/company name
- Policy number
- Coverage type (liability, workers comp, etc)
- Expiration date
- Named insured (should match the roofer)

Return ONLY a JSON object with these exact fields:
{
  "valid_insurance": boolean,
  "provider": string or null,
  "policy_number": string or null,
  "coverage_types": array of strings,
  "expiry_date": string or null (YYYY-MM-DD format),
  "named_insured": string or null,
  "issues": array of strings describing any problems or concerns
}`,
      file_urls: [insurance_url],
      response_json_schema: {
        type: "object",
        properties: {
          valid_insurance: { type: "boolean" },
          provider: { type: ["string", "null"] },
          policy_number: { type: ["string", "null"] },
          coverage_types: { type: "array", items: { type: "string" } },
          expiry_date: { type: ["string", "null"] },
          named_insured: { type: ["string", "null"] },
          issues: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Determine overall verification status
    const licenseValid = licenseAnalysis.valid_license && !licenseAnalysis.issues?.length;
    const insuranceValid = insuranceAnalysis.valid_insurance && !insuranceAnalysis.issues?.length;

    let verificationStatus = 'pending';
    let verificationNotes = '';

    if (licenseValid && insuranceValid) {
      verificationStatus = 'verified';
    } else if (!licenseValid || !insuranceValid) {
      verificationStatus = 'needs_resubmission';
      const issues = [];
      if (!licenseValid) issues.push(`License issues: ${licenseAnalysis.issues?.join(', ')}`);
      if (!insuranceValid) issues.push(`Insurance issues: ${insuranceAnalysis.issues?.join(', ')}`);
      verificationNotes = issues.join('; ');
    }

    // Update or create verification record
    const existing = await base44.asServiceRole.entities.RooferVerification.filter({ roofer_id });
    
    if (existing && existing.length > 0) {
      await base44.asServiceRole.entities.RooferVerification.update(existing[0].id, {
        license_document_url: license_url,
        license_verified: licenseValid,
        license_number: licenseAnalysis.license_number,
        license_state: licenseAnalysis.state,
        license_expiry: licenseAnalysis.expiry_date,
        insurance_document_url: insurance_url,
        insurance_verified: insuranceValid,
        insurance_provider: insuranceAnalysis.provider,
        insurance_policy_number: insuranceAnalysis.policy_number,
        insurance_expiry: insuranceAnalysis.expiry_date,
        verification_status: verificationStatus,
        verification_notes: verificationNotes
      });
    } else {
      await base44.asServiceRole.entities.RooferVerification.create({
        roofer_id,
        license_document_url: license_url,
        license_verified: licenseValid,
        license_number: licenseAnalysis.license_number,
        license_state: licenseAnalysis.state,
        license_expiry: licenseAnalysis.expiry_date,
        insurance_document_url: insurance_url,
        insurance_verified: insuranceValid,
        insurance_provider: insuranceAnalysis.provider,
        insurance_policy_number: insuranceAnalysis.policy_number,
        insurance_expiry: insuranceAnalysis.expiry_date,
        verification_status: verificationStatus,
        verification_notes: verificationNotes
      });
    }

    return Response.json({
      success: true,
      verification_status: verificationStatus,
      license_valid: licenseValid,
      insurance_valid: insuranceValid,
      license_details: {
        number: licenseAnalysis.license_number,
        state: licenseAnalysis.state,
        expiry: licenseAnalysis.expiry_date,
        issues: licenseAnalysis.issues
      },
      insurance_details: {
        provider: insuranceAnalysis.provider,
        policy_number: insuranceAnalysis.policy_number,
        expiry: insuranceAnalysis.expiry_date,
        issues: insuranceAnalysis.issues
      },
      notes: verificationNotes
    });
  } catch (error) {
    console.error('Document verification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});