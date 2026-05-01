import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const GOOGLE_KEY = "AIzaSyA0LIN1yEftyzWNZGVRBAms_FckT3Sg_2U";

async function fetchAndUpload(url, base44, filename) {
  const imgRes = await fetch(url);
  if (!imgRes.ok) throw new Error(`Google Maps fetch failed: ${imgRes.status}`);
  const arrayBuffer = await imgRes.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: "image/jpeg" });
  const file = new File([blob], filename, { type: "image/jpeg" });
  const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });
  return file_url;
}

Deno.serve(async (req) => {
  try {
    const { address } = await req.json();
    if (!address) return Response.json({ error: "address required" }, { status: 400 });

    const base44 = createClientFromRequest(req);
    const encoded = encodeURIComponent(address);

    // Fetch 3 zoom levels in parallel: z19 (neighborhood), z20 (standard), z21 (close-up)
    const [url_z19, url_z20, url_z21] = [19, 20, 21].map(
      z => `https://maps.googleapis.com/maps/api/staticmap?center=${encoded}&zoom=${z}&size=640x640&maptype=satellite&scale=2&key=${GOOGLE_KEY}`
    );

    const [file_url_z19, file_url_z20, file_url_z21] = await Promise.all([
      fetchAndUpload(url_z19, base44, "satellite_z19.jpg"),
      fetchAndUpload(url_z20, base44, "satellite_z20.jpg"),
      fetchAndUpload(url_z21, base44, "satellite_z21.jpg"),
    ]);

    console.log("Satellite images uploaded at z19, z20, z21");

    // Return primary (z20) as file_url for backward compat, plus all three
    return Response.json({
      file_url: file_url_z20,
      file_urls: [file_url_z19, file_url_z20, file_url_z21],
    });
  } catch (error) {
    console.error("fetchSatelliteImage error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});