import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const GOOGLE_KEY = "AIzaSyA0LIN1yEftyzWNZGVRBAms_FckT3Sg_2U";

Deno.serve(async (req) => {
  try {
    const { address } = await req.json();
    if (!address) return Response.json({ error: "address required" }, { status: 400 });

    const base44 = createClientFromRequest(req);

    const satelliteUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(address)}&zoom=20&size=640x640&maptype=satellite&scale=2&key=${GOOGLE_KEY}`;

    const imgRes = await fetch(satelliteUrl);
    if (!imgRes.ok) {
      console.error("Google Maps fetch failed:", imgRes.status, await imgRes.text());
      return Response.json({ error: "Failed to fetch satellite image" }, { status: 502 });
    }

    const arrayBuffer = await imgRes.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    // Build a File-like blob with .jpg extension so the upload is recognized
    const blob = new Blob([uint8], { type: "image/jpeg" });

    const uploaded = await base44.asServiceRole.integrations.Core.UploadFile({ file: blob, filename: "satellite.jpg" });
    console.log("Uploaded satellite image:", uploaded.file_url);

    return Response.json({ file_url: uploaded.file_url });
  } catch (error) {
    console.error("fetchSatelliteImage error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});