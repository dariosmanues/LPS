'use client';

import React, { useState } from 'react';

const VPS_REPORT_LPS_BASE_URL = 'https://report-177-202-246-42.sslip.io';

type EmbedRoute = {
  id: string;
  label: string;
  path: string;
  badge: string;
};

const EMBED_ROUTES: EmbedRoute[] = [
  {
    id: 'auth',
    label: 'Login / Portal LPS Kelurahan',
    path: '/auth?next=%2F',
    badge: 'Kelurahan',
  },
  {
    id: 'admin-auth',
    label: 'Portal Admin Report LPS',
    path: '/admin/auth',
    badge: 'Admin',
  },
  {
    id: 'home',
    label: 'Beranda Report LPS',
    path: '/',
    badge: 'Dashboard',
  },
];

export default function ReportLpsEmbedPage() {
  const [activeRoute, setActiveRoute] = useState<EmbedRoute>(EMBED_ROUTES[0]);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const currentUrl = `${VPS_REPORT_LPS_BASE_URL}${activeRoute.path}`;

  const handleSelectRoute = (route: EmbedRoute) => {
    setIsLoading(true);
    setActiveRoute(route);
    setIframeKey((k) => k + 1);
  };

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey((k) => k + 1);
  };

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-950 flex flex-col'
          : 'flex flex-col h-[calc(100vh-5.5rem)] min-h-[680px] space-y-3'
      }
    >
      {/* Top Control Bar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${
          isFullscreen
            ? 'bg-slate-900 text-white border-b border-slate-800'
            : 'bg-white rounded-2xl border border-slate-200/80 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-lg shadow-xs shrink-0">
            📑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className={`text-sm sm:text-base font-extrabold ${
                  isFullscreen ? 'text-white' : 'text-slate-900'
                }`}
              >
                Report Bulanan LPS Kota Pekanbaru
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                VPS Server Aktif
              </span>
            </div>
            <p
              className={`text-xs ${
                isFullscreen ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Server VPS: <code className="font-mono font-semibold">{ currentUrl }</code>
            </p>
          </div>
        </div>

        {/* Route Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl">
            {EMBED_ROUTES.map((route) => {
              const active = activeRoute.id === route.id;
              return (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => handleSelectRoute(route)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {route.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleReload}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            title="Muat ulang tampilan Report LPS"
          >
            🔄 Refresh
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen((f) => !f)}
            className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs transition-colors cursor-pointer"
          >
            {isFullscreen ? '🗗 Keluar Layar Penuh' : '⛶ Layar Penuh'}
          </button>

          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            ↗ Buka di Tab Baru
          </a>
        </div>
      </div>

      {/* Embedded Frame Container */}
      <div
        className={`relative flex-1 w-full overflow-hidden bg-slate-950 ${
          isFullscreen ? '' : 'rounded-2xl border border-slate-200/80 shadow-md'
        }`}
      >
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-slate-900/75 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-white">
            <div className="w-10 h-10 rounded-full border-3 border-emerald-500/30 border-t-emerald-400 animate-spin" />
            <p className="text-xs sm:text-sm font-bold text-emerald-100">
              Memuat Portal Report LPS dari Server VPS...
            </p>
          </div>
        )}

        <iframe
          key={iframeKey}
          src={currentUrl}
          title="Portal Report Bulanan LPS Kota Pekanbaru"
          onLoad={() => setIsLoading(false)}
          className="w-full h-full border-0"
          allow="clipboard-read; clipboard-write; fullscreen"
        />
      </div>
    </div>
  );
}
