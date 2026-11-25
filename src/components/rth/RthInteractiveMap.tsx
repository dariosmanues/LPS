'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getRthCategoryColor, type RthLocation } from '@/lib/rth-data';

interface RthInteractiveMapProps {
  locations: RthLocation[];
  selectedLocation: RthLocation | null;
  onSelectLocation: (loc: RthLocation) => void;
  showAreaCircles: boolean;
}

type TileStyle = 'street' | 'satellite' | 'light';

const TILE_LAYERS: Record<
  TileStyle,
  { name: string; url: string; attribution: string; maxZoom: number }
> = {
  street: {
    name: 'Peta Jalan (OSM)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  satellite: {
    name: 'Citra Satelit',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
  light: {
    name: 'Peta Terang',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 19,
  },
};

function createMarkerIcon(loc: RthLocation, isSelected: boolean): L.DivIcon {
  const color = getRthCategoryColor(loc.jenisRth, loc.namaFasilitas);
  const size = isSelected ? 36 : loc.jenisRth === 'Taman Kota' || loc.jenisRth === 'Hutan Kota' || loc.jenisRth === 'Kebun Bibit' ? 28 : 22;
  const ring = isSelected
    ? `box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.35), 0 6px 16px rgba(0,0,0,0.35); transform: scale(1.12);`
    : `box-shadow: 0 3px 8px rgba(0,0,0,0.28);`;

  let innerSvg = '';
  if (loc.jenisRth === 'Taman Kota' || loc.jenisRth === 'Hutan Kota') {
    innerSvg = `<svg width="${Math.round(size * 0.55)}" height="${Math.round(size * 0.55)}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L5 12h4l-2 7h10l-2-7h4L12 2z"/><path d="M12 19v3"/></svg>`;
  } else if (loc.jenisRth === 'Kebun Bibit') {
    innerSvg = `<svg width="${Math.round(size * 0.55)}" height="${Math.round(size * 0.55)}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></svg>`;
  } else {
    innerSvg = `<svg width="${Math.round(size * 0.52)}" height="${Math.round(size * 0.52)}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`;
  }

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 9999px;
      background: ${color.bg};
      border: 2.5px solid white;
      outline: 1.5px solid ${color.border};
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      cursor: pointer;
      ${ring}
    ">
      ${innerSvg}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'rth-custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
}

function buildPopupHtml(loc: RthLocation): string {
  const color = getRthCategoryColor(loc.jenisRth, loc.namaFasilitas);
  const luasHa = (loc.luasM2 / 10000).toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
  const luasFormatted = loc.luasM2.toLocaleString('id-ID');
  const gmapsUrl = `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;

  return `
    <div style="font-family: Inter, system-ui, -apple-system, sans-serif; min-width: 265px; max-width: 310px; color: #0f172a; padding: 2px;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 8px;">
        <span style="
          display: inline-block;
          padding: 3px 9px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          background: ${color.badgeBg};
          color: ${color.badgeText};
        ">
          ${loc.jenisRth}
        </span>
        <span style="font-size: 11px; font-weight: 700; color: #64748b; background: #f1f5f9; padding: 2px 7px; border-radius: 6px;">
          No. #${loc.no}
        </span>
      </div>

      <h3 style="margin: 0 0 6px 0; font-size: 14.5px; font-weight: 800; color: #0f172a; line-height: 1.3;">
        ${loc.namaFasilitas}
      </h3>

      <p style="margin: 0 0 10px 0; font-size: 12px; color: #475569; line-height: 1.4;">
        📍 ${loc.alamat}
      </p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 10px; margin-bottom: 10px;">
        <div>
          <div style="font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase;">Luas RTH</div>
          <div style="font-size: 13.5px; font-weight: 800; color: #047857;">${luasFormatted} m²</div>
          <div style="font-size: 10.5px; color: #64748b;">(${luasHa} Ha)</div>
        </div>
        <div>
          <div style="font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase;">Kepemilikan</div>
          <div style="font-size: 12px; font-weight: 700; color: #1e293b; margin-top: 2px;">${loc.kepemilikan}</div>
          <div style="font-size: 10.5px; color: #64748b;">Kec. ${loc.kecamatan}</div>
        </div>
      </div>

      <div style="background: #f1f5f9; border-radius: 8px; padding: 6px 9px; margin-bottom: 10px; font-size: 11px; color: #334155;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span style="color: #64748b; font-weight: 600;">Koordinat DMS:</span>
          <span style="font-family: monospace; font-weight: 700;">${loc.latDms}, ${loc.lngDms}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748b; font-weight: 600;">Desimal (Lat/Long):</span>
          <span style="font-family: monospace; font-weight: 700;">${loc.lat}, ${loc.lng}</span>
        </div>
      </div>

      <div style="display: flex; gap: 6px;">
        <a
          href="${gmapsUrl}"
          target="_blank"
          rel="noopener noreferrer"
          style="
            flex: 1;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            background: #059669;
            color: white;
            text-decoration: none;
            font-size: 11.5px;
            font-weight: 700;
            padding: 7px 10px;
            border-radius: 8px;
            text-align: center;
          "
        >
          🗺️ Buka di Google Maps
        </a>
      </div>
    </div>
  `;
}

export default function RthInteractiveMap({
  locations,
  selectedLocation,
  onSelectLocation,
  showAreaCircles,
}: RthInteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const circlesLayerRef = useRef<L.LayerGroup | null>(null);
  const markerMapRef = useRef<Map<string, L.Marker>>(new Map());

  const [tileStyle, setTileStyle] = useState<TileStyle>('street');

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [0.515, 101.455], // Pusat Kota Pekanbaru
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const initialTile = TILE_LAYERS.street;
    const tileLayer = L.tileLayer(initialTile.url, {
      attribution: initialTile.attribution,
      maxZoom: initialTile.maxZoom,
    }).addTo(map);

    const circlesGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    tileLayerRef.current = tileLayer;
    circlesLayerRef.current = circlesGroup;
    markersLayerRef.current = markersGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch basemap tile style
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const cfg = TILE_LAYERS[tileStyle];
    tileLayerRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
    }).addTo(map);
  }, [tileStyle]);

  // Render markers and area circles whenever filtered locations or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    const circlesGroup = circlesLayerRef.current;
    if (!map || !markersGroup || !circlesGroup) return;

    markersGroup.clearLayers();
    circlesGroup.clearLayers();
    markerMapRef.current.clear();

    locations.forEach((loc) => {
      const isSelected = selectedLocation?.id === loc.id;
      const color = getRthCategoryColor(loc.jenisRth, loc.namaFasilitas);

      if (showAreaCircles) {
        // Approximate visual radius in meters from area (capped for readability)
        const realRadius = Math.sqrt(loc.luasM2 / Math.PI);
        const visualRadius = Math.max(45, Math.min(850, realRadius * 1.4));
        const circle = L.circle([loc.lat, loc.lng], {
          radius: visualRadius,
          color: color.border,
          weight: 1.5,
          fillColor: color.bg,
          fillOpacity: 0.22,
        });
        circle.on('click', () => {
          onSelectLocation(loc);
        });
        circlesGroup.addLayer(circle);
      }

      const marker = L.marker([loc.lat, loc.lng], {
        icon: createMarkerIcon(loc, isSelected),
        zIndexOffset: isSelected ? 1000 : loc.jenisRth === 'Taman Kota' || loc.jenisRth === 'Hutan Kota' ? 300 : 0,
      });

      marker.bindPopup(buildPopupHtml(loc), {
        maxWidth: 325,
        className: 'rth-leaflet-popup',
      });

      marker.on('click', () => {
        onSelectLocation(loc);
      });

      markersGroup.addLayer(marker);
      markerMapRef.current.set(loc.id, marker);
    });
  }, [locations, selectedLocation, showAreaCircles, onSelectLocation]);

  // Fly to selectedLocation and open its popup
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedLocation) return;

    const marker = markerMapRef.current.get(selectedLocation.id);
    map.flyTo([selectedLocation.lat, selectedLocation.lng], Math.max(map.getZoom(), 15), {
      duration: 0.75,
    });
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 350);
    }
  }, [selectedLocation]);

  const handleResetView = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map((l) => [l.lat, l.lng] as [number, number]));
      map.flyToBounds(bounds, { padding: [36, 36], maxZoom: 13, duration: 0.7 });
    } else {
      map.flyTo([0.515, 101.455], 12, { duration: 0.7 });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[520px] rounded-2xl overflow-hidden border border-emerald-100 shadow-inner bg-slate-100">
      {/* Floating Top-Left Map Controls: Basemap Switcher */}
      <div className="absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-slate-200/80">
        {(['street', 'satellite', 'light'] as TileStyle[]).map((style) => (
          <button
            key={style}
            type="button"
            onClick={() => setTileStyle(style)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tileStyle === style
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {TILE_LAYERS[style].name}
          </button>
        ))}
        <button
          type="button"
          onClick={handleResetView}
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer"
          title="Tampilkan seluruh titik RTH Kota Pekanbaru"
        >
          🎯 Reset Fokus Peta
        </button>
      </div>

      {/* Floating Bottom-Left Legend */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-lg border border-slate-200/80 text-xs">
        <div className="font-extrabold text-slate-700 mb-1.5 text-[11px] uppercase tracking-wider">
          Legenda Titik RTH ({locations.length} Lokasi)
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-3.5 gap-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#10b981] border border-white ring-1 ring-[#047857] inline-block" />
            <span className="font-semibold text-slate-700">Taman Kota</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#047857] border border-white ring-1 ring-[#064e3b] inline-block" />
            <span className="font-semibold text-slate-700">Hutan Kota</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#65a30d] border border-white ring-1 ring-[#3f6212] inline-block" />
            <span className="font-semibold text-slate-700">Jalur Hijau Jalan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#d97706] border border-white ring-1 ring-[#92400e] inline-block" />
            <span className="font-semibold text-slate-700">Tugu & Bundaran</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#0891b2] border border-white ring-1 ring-[#155e75] inline-block" />
            <span className="font-semibold text-slate-700">Kebun Bibit</span>
          </div>
        </div>
      </div>

      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-[540px] lg:h-[620px]" />
    </div>
  );
}
