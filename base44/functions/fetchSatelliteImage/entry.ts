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
      console.error("Google Maps fetch failed:", imgRes.status);
      return Response.json({ error: "Failed to fetch satellite image" }, { status: 502 });
    }

    const arrayBuffer = await imgRes.arrayBuffer();

    // Use FormData to send as multipart (required by UploadFile)
    const formData = new FormData();
    const blob = new Blob([arrayBuffer], { type: "image/jpeg" });
    formData.append("file", blob, "satellite.jpg");

    // Call the Base44 upload endpoint directly via the SDK's underlying HTTP
    const uploadRes = await fetch("https://api.base44.com/api/apps/" + Deno.env.get("BASE44_APP_ID") + "/integrations/Core/UploadFile", {
      method: "POST",
      headers: {
        "Authorization": req.headers.get("Authorization") || "",
      },
      body: formData,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("Upload failed:", uploadRes.status, errText);
      return Response.json({ error: "Upload failed: " + errText }, { status: 502 });
    }

    const uploadData = await uploadRes.json();
    console.log("Uploaded satellite image:", uploadData.file_url);

    return Response.json({ file_url: uploadData.file_url });
  } catch (error) {
    console.error("fetchSatelliteImage error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});