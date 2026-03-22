import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const GOOGLE_KEY = "AIzaSyA0LIN1yEftyzWNZGVRBAms_FckT3Sg_2U";

Deno.serve(async (req) => {
  try {
    const { address } = await req.json();
    if (!address) return Response.json({ error: "address required" }, { status: 400 });

    const satelliteUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(address)}&zoom=20&size=640x640&maptype=satellite&scale=2&key=${GOOGLE_KEY}`;

    const imgRes = await fetch(satelliteUrl);
    if (!imgRes.ok) {
      console.error("Google Maps fetch failed:", imgRes.status);
      return Response.json({ error: "Failed to fetch satellite image" }, { status: 502 });
    }

    const arrayBuffer = await imgRes.arrayBuffer();

    // Upload to Base44 storage to get a real URL (InvokeLLM requires real URLs, not data: URIs)
    const base44 = createClientFromRequest(req);
    const blob = new Blob([arrayBuffer], { type: "image/jpeg" });
    const file = new File([blob], "satellite.jpg", { type: "image/jpeg" });

    const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });

    console.log("Satellite image uploaded, url:", file_url);
    return Response.json({ file_url });
  } catch (error) {
    console.error("fetchSatelliteImage error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});