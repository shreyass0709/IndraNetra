'use client';

import React, { useEffect, useRef } from 'react';

interface MapComponentProps {
  latitude: number;
  longitude: number;
  volunteers: any[];
  incidents: any[];
  sosRequests: any[];
  routingPath: [number, number][];
  lostChildren?: any[];
}

export default function MapComponent({
  latitude,
  longitude,
  volunteers,
  incidents,
  sosRequests,
  routingPath,
  lostChildren = [],
}: MapComponentProps) {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  useEffect(() => {
    // Return if DOM element is not ready or window is not defined
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    // Load leaflet
    const L = require('leaflet');

    // Setup marker icons using SVG overlays so we don't have broken asset issues
    const createSvgIcon = (color: string, animate = false) => {
      const animationClass = animate ? 'animate-ping' : '';
      return L.divIcon({
        className: 'custom-icon',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            ${animate ? `<div class="absolute w-8 h-8 rounded-full bg-${color}-500 opacity-40 ${animationClass}"></div>` : ''}
            <div class="w-4 h-4 rounded-full border-2 border-white shadow-md bg-${color}-500" style="background-color: ${color};"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    };

    // Initialize map
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

    // Add main event marker
    const eventMarker = L.marker([latitude, longitude], {
      icon: createSvgIcon('#3b82f6'), // Blue for event center
    })
      .addTo(map)
      .bindPopup(`<b>Event Location</b><br/>Center Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    markersRef.current.push(eventMarker);

    // Add volunteers markers
    volunteers.forEach((v) => {
      if (v.latitude && v.longitude) {
        const markerColor = v.status === 'AVAILABLE' ? '#10b981' : '#f59e0b'; // Green or Amber
        const volMarker = L.marker([v.latitude, v.longitude], {
          icon: createSvgIcon(markerColor),
        })
          .addTo(map)
          .bindPopup(`<b>Volunteer: ${v.user?.name || 'Assigned'}</b><br/>Status: ${v.status}<br/>Last Active: ${new Date(v.lastActive).toLocaleTimeString()}`);
        markersRef.current.push(volMarker);
      }
    });

    // Add incident markers
    incidents.forEach((inc) => {
      if (inc.latitude && inc.longitude) {
        const incMarker = L.marker([inc.latitude, inc.longitude], {
          icon: createSvgIcon('#f97316'), // Orange
        })
          .addTo(map)
          .bindPopup(`<b>Incident: ${inc.title}</b><br/>Description: ${inc.description}<br/>Reporter: ${inc.user?.name || 'Anonymous'}`);
        markersRef.current.push(incMarker);
      }
    });

    // Add SOS requests markers (pulsing red)
    sosRequests.forEach((sos) => {
      if (sos.latitude && sos.longitude) {
        const sosMarker = L.marker([sos.latitude, sos.longitude], {
          icon: createSvgIcon('#ef4444', true), // Pulsing Red
        })
          .addTo(map)
          .bindPopup(`<b>SOS Emergency</b><br/>Type: ${sos.issueType}<br/>Desc: ${sos.description || 'No details'}<br/>Sender: ${sos.user?.name || 'Unknown'}`);
        markersRef.current.push(sosMarker);
      }
    });

    // Add lost children markers (pulsing pink)
    lostChildren.forEach((child) => {
      if (child.latitude && child.longitude) {
        const childMarker = L.marker([child.latitude, child.longitude], {
          icon: createSvgIcon('#d946ef', true), // Pulsing Pink/Magenta
        })
          .addTo(map)
          .bindPopup(`<b>Lost Child: ${child.name}</b><br/>Age: ${child.age} yrs<br/>Last Area: ${child.lastSeen}<br/>Status: ${child.status || 'REPORTED'}`);
        markersRef.current.push(childMarker);
      }
    });

    // Handle evacuation routes (A* pathfinding)
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (routingPath && routingPath.length > 0) {
      polylineRef.current = L.polyline(routingPath, {
        color: '#10b981', // green exit path
        weight: 5,
        opacity: 0.9,
        dashArray: '10, 10',
        lineJoin: 'round',
      }).addTo(map);
      
      // zoom fit bounds to show path
      map.fitBounds(polylineRef.current.getBounds());
    }

    return () => {
      // Don't destroy map completely on props change, just let it update markers
    };
  }, [latitude, longitude, volunteers, incidents, sosRequests, routingPath, lostChildren]);

  // Clean up map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border border-zinc-800 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '400px' }} />
    </div>
  );
}
