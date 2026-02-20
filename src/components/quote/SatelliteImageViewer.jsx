import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Satellite, ExternalLink, Info, ZoomIn, ZoomOut } from "lucide-react";

export default function SatelliteImageViewer({ address }) {
  const [zoom, setZoom] = useState(20);

  if (!address) return null;

  // Google Static Maps API — satellite imagery at the property level
  const encodedAddress = encodeURIComponent(address);
  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddress}&zoom=${zoom}&size=800x500&maptype=satellite&key=AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY`;

  // Fallback: Google Maps embed (no API key needed for iframe embed)
  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY&q=${encodedAddress}&maptype=satellite&zoom=${zoom}`;

  // Use the embed approach which works without billing enabled
  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}&layer=satellite`;

  return (
    <Card className="border-slate-200 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-slate-400" />
            <CardTitle className="text-lg font-semibold">Satellite View</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.max(17, zoom - 1))}
              className="h-8 w-8 p-0"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs text-slate-400 w-8 text-center">{zoom}x</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.min(21, zoom + 1))}
              className="h-8 w-8 p-0"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <a
              href={googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 ml-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in Maps
            </a>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative bg-slate-900" style={{ height: 360 }}>
          <iframe
            key={`${zoom}-${address}`}
            title="Satellite View"
            width="100%"
            height="360"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={`https://maps.google.com/maps?q=${encodedAddress}&t=k&z=${zoom}&output=embed`}
          />
          {/* Overlay label */}
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
            <Satellite className="w-3 h-3 text-amber-400" />
            <span>Satellite imagery used for AI roof analysis</span>
          </div>
        </div>
        <div className="p-3 bg-amber-50 border-t border-amber-100 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Our AI analyzed this satellite view to measure your roof. If the address is wrong or the image shows the incorrect property, update the measurements below.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}