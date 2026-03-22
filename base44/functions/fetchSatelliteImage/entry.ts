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
    const bytes = new Uint8Array(arrayBuffer);

    // Convert to base64
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    console.log("Satellite image fetched, base64 length:", base64.length);
    return Response.json({ data_url: dataUrl });
  } catch (error) {
    console.error("fetchSatelliteImage error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});