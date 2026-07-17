'use client';

import React, { useEffect, useRef } from 'react';

interface LocationPickerProps {
  /** Venue centre — where the picker opens when nothing is placed yet. */
  centerLat: number;
  centerLng: number;
  /** Current placement, or null if this camera has not been placed. */
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

/**
 * Click-to-place map for choosing where a camera physically sits.
 * Opens on the venue so placement is relative to the event being set up,
 * not to some fixed default location.
 */
export default function LocationPicker({
  centerLat,
  centerLng,
  latitude,
  longitude,
  onChange,
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  // Keep the latest handler without re-running the map setup effect.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;
    const L = require('leaflet');

    const map = L.map(containerRef.current).setView([latitude ?? centerLat, longitude ?? centerLng], 17);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const icon = L.divIcon({
      className: 'custom-icon',
      html: `<div class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    const place = (lat: number, lng: number) => {
      if (markerRef.current) markerRef.current.remove();
      markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
      markerRef.current.on('dragend', () => {
        const p = markerRef.current.getLatLng();
        onChangeRef.current(p.lat, p.lng);
      });
    };

    if (latitude !== null && longitude !== null) place(latitude, longitude);

    map.on('click', (e: any) => {
      place(e.latlng.lat, e.latlng.lng);
      onChangeRef.current(e.latlng.lat, e.latlng.lng);
    });

    // Leaflet mis-measures a container that was hidden when the map was built.
    setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Rebuilding on every prop change would drop the marker mid-drag; the venue
    // centre is what decides where this picker opens.
  }, [centerLat, centerLng]);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden border border-border"
        style={{ height: 260 }}
      />
      <p className="text-[10px] text-zinc-500 font-mono">
        {latitude !== null && longitude !== null ? (
          <>PLACED AT {latitude.toFixed(5)}, {longitude.toFixed(5)} — click or drag to adjust</>
        ) : (
          <>Click the map to place this camera. Unplaced cameras are left off the heatmap.</>
        )}
      </p>
    </div>
  );
}
