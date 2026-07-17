'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Start of the CRITICAL Fruin band (people/m²) — the same threshold the backend
 * classifies risk on (`backend/src/common/risk.util.ts`). Heat weight is scaled
 * against it, so full red means the same measured danger at every venue.
 */
const CRITICAL_DENSITY = 6;

interface MapComponentProps {
  latitude: number;
  longitude: number;
  volunteers: any[];
  incidents: any[];
  sosRequests: any[];
  routingPath: [number, number][];
  lostChildren?: any[];
  cameras?: any[];
}

export default function MapComponent({
  latitude,
  longitude,
  volunteers,
  incidents,
  sosRequests,
  routingPath,
  lostChildren = [],
  cameras = [],
}: MapComponentProps) {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    const L = require('leaflet');
    // leaflet.heat is an old-style plugin: no module wrapper, it just reads a
    // bare `L` global and hangs `L.heatLayer` off it. Leaflet itself is required
    // lazily here to keep `window` out of the server render, so the global has
    // to be set before the plugin is loaded — importing it at module scope
    // throws "L is not defined".
    (window as any).L = L;
    require('leaflet.heat');

    // Create styled marker icon
    const createSvgIcon = (color: string, animate = false) => {
      const animationClass = animate ? 'animate-ping' : '';
      return L.divIcon({
        className: 'custom-icon',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            ${animate ? `<div class="absolute w-8 h-8 rounded-full opacity-40 ${animationClass}" style="background-color: ${color};"></div>` : ''}
            <div class="w-4 h-4 rounded-full border-2 border-white shadow-md" style="background-color: ${color};"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    };

    // Initialize Leaflet map
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([latitude, longitude], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapRef.current);
    } else {
      mapRef.current.setView([latitude, longitude], mapRef.current.getZoom());
    }

    const map = mapRef.current;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add main event center marker
    const eventMarker = L.marker([latitude, longitude], {
      icon: createSvgIcon('#3b82f6'),
    })
      .addTo(map)
      .bindPopup(`<b>Event Center</b><br/>Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    markersRef.current.push(eventMarker);

    // Add volunteers
    volunteers.forEach((v) => {
      if (v.latitude && v.longitude) {
        const markerColor = v.status === 'AVAILABLE' ? '#10b981' : '#f59e0b'; // Green or Amber
        const volMarker = L.marker([v.latitude, v.longitude], {
          icon: createSvgIcon(markerColor),
        })
          .addTo(map)
          .bindPopup(`<b>Volunteer: ${v.user?.name || 'Assigned'}</b><br/>Status: ${v.status}`);
        markersRef.current.push(volMarker);
      }
    });

    // Add incidents (User reports)
    incidents.forEach((inc) => {
      if (inc.latitude && inc.longitude) {
        const incMarker = L.marker([inc.latitude, inc.longitude], {
          icon: createSvgIcon('#f97316'), // Orange
        })
          .addTo(map)
          .bindPopup(`<b>Incident: ${inc.title}</b><br/>Status: ${inc.status || 'PENDING'}<br/>Desc: ${inc.description}`);
        markersRef.current.push(incMarker);
      }
    });

    // Add SOS requests (pulsing red)
    sosRequests.forEach((sos) => {
      if (sos.latitude && sos.longitude) {
        const sosMarker = L.marker([sos.latitude, sos.longitude], {
          icon: createSvgIcon('#ef4444', true),
        })
          .addTo(map)
          .bindPopup(`<b>🚨 SOS EMERGENCY</b><br/>Type: ${sos.issueType}<br/>Sender: ${sos.user?.name || 'Unknown'}<br/>Status: ${sos.status}`);
        markersRef.current.push(sosMarker);
      }
    });

    // Cameras render where they were actually placed. A camera with no
    // coordinates is skipped rather than guessed at — inventing a position
    // would put live crowd density on a spot nobody is watching.
    const placedCameras = cameras.filter(
      (cam) => typeof cam.latitude === 'number' && typeof cam.longitude === 'number',
    );

    placedCameras.forEach((cam) => {
      const risk = cam.riskLevel || 'LOW';
      // Map Risk to colors
      const color = risk === 'CRITICAL' || risk === 'HIGH' ? '#ef4444' : risk === 'MEDIUM' ? '#f59e0b' : '#10b981';

      // Draw camera icon
      const camMarker = L.marker([cam.latitude, cam.longitude], {
        icon: createSvgIcon(color, risk === 'CRITICAL' || risk === 'HIGH'),
      })
        .addTo(map)
        .bindPopup(`<b>🎥 Camera: ${cam.name}</b><br/>Location: ${cam.location}<br/>Risk Assessment: <b>${risk}</b><br/>People Count: ${cam.peopleCount || 0}`);

      markersRef.current.push(camMarker);
    });

    // Live tactical heat layer, weighted by each camera's measured density at
    // its own position. Intensity is normalised against the CRITICAL Fruin band
    // (6 people/m²) so colour means the same thing at every venue.
    if (heatLayerRef.current) {
      heatLayerRef.current.remove();
      heatLayerRef.current = null;
    }

    const heatPoints = placedCameras
      .map((cam) => {
        const density = typeof cam.density === 'number' ? cam.density : 0;
        return [cam.latitude, cam.longitude, Math.min(density / CRITICAL_DENSITY, 1)] as [number, number, number];
      })
      .filter(([, , weight]) => weight > 0);

    if (heatPoints.length > 0) {
      heatLayerRef.current = (L as any)
        .heatLayer(heatPoints, {
          radius: 45,
          blur: 30,
          maxZoom: 17,
          max: 1,
          gradient: { 0.0: '#10b981', 0.35: '#84cc16', 0.6: '#f59e0b', 0.85: '#ef4444' },
        })
        .addTo(map);
    }

    // Handle evacuation routes (A* Exit path)
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (routingPath && routingPath.length > 0) {
      polylineRef.current = L.polyline(routingPath, {
        color: '#10b981', // green safe evacuation vector
        weight: 6,
        opacity: 0.95,
        dashArray: '12, 12',
        lineJoin: 'round',
      }).addTo(map);

      // Fit bounds to display full evacuation vector
      map.fitBounds(polylineRef.current.getBounds(), { padding: [30, 30] });
    }

  }, [latitude, longitude, volunteers, incidents, sosRequests, routingPath, lostChildren, cameras]);

  // Clean up Leaflet map
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border border-border shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '400px' }} />
    </div>
  );
}
