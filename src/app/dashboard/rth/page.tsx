'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  RTH_DATA_2025,
  RTH_OFFICIAL_SUMMARY,
  getRthCategoryColor,
  type RthLocation,
} from '@/lib/rth-data';

const RthInteractiveMap = dynamic(() => import('@/components/rth/RthInteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[540px] lg:h-[620px] rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col items-center justify-center gap-3 animate-pulse">
      <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 flex items-center justify-center text-2xl">
        🌳
      </div>
      <p className="text-sm font-bold text-emerald-800">Memuat Peta Interaktif RTH Kota Pekanbaru...</p>
    </div>
  ),
});

const JENIS_COLORS: Record<string, string> = {
  'Taman Kota': '#10b981',
  'Jalur Hijau Di Jalan': '#65a30d',
  'Hutan Kota': '#047857',
  'Kebun Bibit': '#0891b2',
};

export default function RthDashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJenis, setSelectedJenis] = useState<string>('ALL');
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('ALL');
  const [selectedKepemilikan, setSelectedKepemilikan] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'no' | 'luas_desc' | 'luas_asc' | 'nama'>('no');
  const [showAreaCircles, setShowAreaCircles] = useState<boolean>(true);
  const [selectedLocation, setSelectedLocation] = useState<RthLocation | null>(null);
  const [detailModalLocation, setDetailModalLocation] = useState<RthLocation | null>(null);
  const [copiedCoordId, setCopiedCoordId] = useState<string | null>(null);

  // Extract unique Kecamatan options
  const kecamatanOptions = useMemo(() => {
    const set = new Set<string>();
    RTH_DATA_2025.forEach((item) => {
      if (item.kecamatan) set.add(item.kecamatan);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, []);

  // Filtered RTH Locations
  const filteredLocations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = RTH_DATA_2025.filter((item) => {
      if (selectedJenis !== 'ALL' && item.jenisRth !== selectedJenis) return false;
      if (selectedKecamatan !== 'ALL' && item.kecamatan !== selectedKecamatan) return false;
      if (selectedKepemilikan !== 'ALL' && item.kepemilikan !== selectedKepemilikan) return false;
      if (q) {
        const hay = `${item.no} ${item.namaFasilitas} ${item.alamat} ${item.jenisRth} ${item.kecamatan} ${item.kepemilikan}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'luas_desc') return b.luasM2 - a.luasM2;
      if (sortBy === 'luas_asc') return a.luasM2 - b.luasM2;
      if (sortBy === 'nama') return a.namaFasilitas.localeCompare(b.namaFasilitas);
      return a.no - b.no;
    });
  }, [searchQuery, selectedJenis, selectedKecamatan, selectedKepemilikan, sortBy]);

  // Summary statistics for currently filtered items
  const stats = useMemo(() => {
    const totalTitik = filteredLocations.length;
    const totalLuasM2 = filteredLocations.reduce((acc, r) => acc + r.luasM2, 0);
    const totalLuasHa = totalLuasM2 / 10000;

    const byJenisMap = new Map<string, { name: string; count: number; luasM2: number; luasHa: number; color: string }>();
    ['Taman Kota', 'Jalur Hijau Di Jalan', 'Hutan Kota', 'Kebun Bibit'].forEach((j) => {
      byJenisMap.set(j, { name: j, count: 0, luasM2: 0, luasHa: 0, color: JENIS_COLORS[j] || '#10b981' });
    });

    const byKecMap = new Map<string, { kecamatan: string; count: number; luasM2: number; luasHa: number }>();
    const byOwnerMap = new Map<string, { name: string; count: number; luasM2: number }>();

    filteredLocations.forEach((loc) => {
      const j = byJenisMap.get(loc.jenisRth);
      if (j) {
        j.count += 1;
        j.luasM2 += loc.luasM2;
        j.luasHa = Number((j.luasM2 / 10000).toFixed(2));
      }

      const kecKey = loc.kecamatan || 'Pekanbaru Kota';
      const k = byKecMap.get(kecKey) || { kecamatan: kecKey, count: 0, luasM2: 0, luasHa: 0 };
      k.count += 1;
      k.luasM2 += loc.luasM2;
      k.luasHa = Number((k.luasM2 / 10000).toFixed(2));
      byKecMap.set(kecKey, k);

      const o = byOwnerMap.get(loc.kepemilikan) || { name: loc.kepemilikan, count: 0, luasM2: 0 };
      o.count += 1;
      o.luasM2 += loc.luasM2;
      byOwnerMap.set(loc.kepemilikan, o);
    });

    const byJenis = Array.from(byJenisMap.values());
    const byKecamatan = Array.from(byKecMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
    const top10Largest = [...filteredLocations]
      .sort((a, b) => b.luasM2 - a.luasM2)
      .slice(0, 10);
    const byOwner = Array.from(byOwnerMap.values()).sort((a, b) => b.luasM2 - a.luasM2);

    return {
      totalTitik,
      totalLuasM2,
      totalLuasHa,
      byJenis,
      byKecamatan,
      top10Largest,
      byOwner,
    };
  }, [filteredLocations]);

  const handlePointSelect = (loc: RthLocation) => {
    setSelectedLocation(loc);
  };

  const handleCopyCoord = (loc: RthLocation) => {
    navigator.clipboard.writeText(`${loc.lat}, ${loc.lng}`);
    setCopiedCoordId(loc.id);
    setTimeout(() => setCopiedCoordId(null), 2000);
  };

  const handleExportCsv = () => {
    const headers = [
      'No',
      'Jenis RTH',
      'Nama Fasilitas',
      'Alamat',
      'Kecamatan',
      'Latitude (DMS)',
      'Longitude (DMS)',
      'Latitude (Desimal)',
      'Longitude (Desimal)',
      'Kepemilikan',
      'Luas RTH (m2)',
      'Luas RTH (Ha)',
    ];
    const rows = filteredLocations.map((r) => [
      r.no,
      `"${r.jenisRth}"`,
      `"${r.namaFasilitas.replace(/"/g, '""')}"`,
      `"${r.alamat.replace(/"/g, '""')}"`,
      `"${r.kecamatan}"`,
      `"${r.latDms}"`,
      `"${r.lngDms}"`,
      r.lat,
      r.lng,
      `"${r.kepemilikan}"`,
      r.luasM2,
      (r.luasM2 / 10000).toFixed(4),
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DATA_RTH_DLHK_PEKANBARU_2025.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-emerald-900 via-emerald-800 to-teal-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold uppercase tracking-wider">
              <span>🌳</span> Bidang Pertamanan • DLHK Kota Pekanbaru Tahun 2025
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Dashboard Ruang Terbuka Hijau (RTH) Kota Pekanbaru
            </h1>
            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
              Visualisasi pemetaan geospasial interaktif & analisis <strong>155 titik fasilitas RTH</strong> yang dikelola oleh Dinas Lingkungan Hidup dan Kebersihan (DLHK) Kota Pekanbaru. Klik pada setiap titik di peta untuk melihat pop-up detail fasilitas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <span>📥</span> Unduh Data RTH (CSV/Excel)
            </button>
          </div>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Titik RTH Dikelola
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {stats.totalTitik.toLocaleString('id-ID')}
              <span className="text-sm font-bold text-slate-500 ml-1.5">Titik</span>
            </p>
            <p className="text-xs text-emerald-700 font-semibold mt-1.5">
              Dari total {RTH_DATA_2025.length} fasilitas RTH DLHK 2025
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl shrink-0">
            📍
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Luas RTH Dikelola DLHK
            </p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
              {(selectedJenis === 'ALL' && selectedKecamatan === 'ALL' && selectedKepemilikan === 'ALL' && !searchQuery
                ? RTH_OFFICIAL_SUMMARY.luasRthDikelolaM2
                : stats.totalLuasM2
              ).toLocaleString('id-ID')}
              <span className="text-sm font-bold text-slate-500 ml-1">m²</span>
            </p>
            <p className="text-xs text-slate-600 font-semibold mt-1.5">
              Setara{' '}
              <strong>
                {(selectedJenis === 'ALL' && selectedKecamatan === 'ALL' && selectedKepemilikan === 'ALL' && !searchQuery
                  ? RTH_OFFICIAL_SUMMARY.luasRthDikelolaM2 / 10000
                  : stats.totalLuasHa
                ).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                Hektar (Ha)
              </strong>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center text-2xl shrink-0">
            🌿
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Cakupan terhadap Luas Kota
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {RTH_OFFICIAL_SUMMARY.persentaseRthDikelola.toLocaleString('id-ID')}%
            </p>
            <p className="text-xs text-slate-600 font-semibold mt-1.5">
              Luas Kota Pekanbaru: <strong>63.899,59 Ha</strong>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl shrink-0">
            🗺️
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Komposisi Jenis RTH
            </p>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              4 Kategori
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-2 text-xs">
            {stats.byJenis.map((j) => (
              <div
                key={j.name}
                className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100"
              >
                <span className="font-semibold text-slate-700 truncate mr-1">
                  {j.name === 'Jalur Hijau Di Jalan' ? 'Jalur Hijau' : j.name}
                </span>
                <span className="font-black text-emerald-700">{j.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: `Semua RTH (${RTH_DATA_2025.length})` },
              { id: 'Taman Kota', label: '🌳 Taman Kota (15)' },
              { id: 'Hutan Kota', label: '🌲 Hutan Kota (1)' },
              { id: 'Jalur Hijau Di Jalan', label: '🌿 Jalur Hijau & Tugu (137)' },
              { id: 'Kebun Bibit', label: '🌱 Kebun Bibit (2)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedJenis(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedJenis === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Toggle Area Circles */}
          <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 bg-emerald-50/80 border border-emerald-200 px-3 py-2 rounded-xl cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showAreaCircles}
              onChange={(e) => setShowAreaCircles(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Tampilkan Radius Luas pada Peta</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama taman, jalan, tugu, alamat..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
          </div>

          <select
            value={selectedKecamatan}
            onChange={(e) => setSelectedKecamatan(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Kecamatan</option>
            {kecamatanOptions.map((kec) => (
              <option key={kec} value={kec}>
                Kec. {kec}
              </option>
            ))}
          </select>

          <select
            value={selectedKepemilikan}
            onChange={(e) => setSelectedKepemilikan(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Status Kepemilikan</option>
            <option value="Pemerintah Kota">Pemerintah Kota</option>
            <option value="Pemerintah Provinsi">Pemerintah Provinsi</option>
            <option value="Masyarakat/ Perorangan">Masyarakat / Perorangan</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="no">Urutan Nomor Dokumen (#1 - #166)</option>
            <option value="luas_desc">Luas RTH Terbesar → Terkecil</option>
            <option value="luas_asc">Luas RTH Terkecil → Terbesar</option>
            <option value="nama">Nama Fasilitas (A - Z)</option>
          </select>
        </div>
      </div>

      {/* Main Interactive Map + Sidebar Quick List */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Map Column (8 cols on XL) */}
        <div className="xl:col-span-8 flex flex-col">
          <RthInteractiveMap
            locations={filteredLocations}
            selectedLocation={selectedLocation}
            onSelectLocation={handlePointSelect}
            showAreaCircles={showAreaCircles}
          />
        </div>

        {/* Right Side: Selected Point Detail Card + Scrollable Point Selector (4 cols on XL) */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          {/* Active Point Inspector Card */}
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                📌 Detail Titik RTH Terpilih
              </span>
              {selectedLocation && (
                <button
                  type="button"
                  onClick={() => setDetailModalLocation(selectedLocation)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                >
                  Lihat Pop-up Penuh
                </button>
              )}
            </div>

            {selectedLocation ? (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      {selectedLocation.jenisRth}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      No. #{selectedLocation.no}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {selectedLocation.namaFasilitas}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">📍 {selectedLocation.alamat}</p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl p-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500">Luas Area</p>
                    <p className="text-sm font-black text-emerald-700">
                      {selectedLocation.luasM2.toLocaleString('id-ID')} m²
                    </p>
                    <p className="text-[11px] text-slate-500">
                      ({(selectedLocation.luasM2 / 10000).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} Ha)
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500">Kepemilikan</p>
                    <p className="text-xs font-extrabold text-slate-800 mt-0.5">
                      {selectedLocation.kepemilikan}
                    </p>
                    <p className="text-[11px] text-slate-500">Kec. {selectedLocation.kecamatan}</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-2.5 text-xs space-y-1 border border-slate-200/70">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">DMS:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {selectedLocation.latDms}, {selectedLocation.lngDms}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Lat / Long:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {selectedLocation.lat}, {selectedLocation.lng}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
                  >
                    🗺️ Google Maps
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyCoord(selectedLocation)}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    {copiedCoordId === selectedLocation.id ? '✅ Tersalin' : '📋 Salin Koordinat'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                Klik salah satu titik marker pada peta atau daftar di bawah untuk menampilkan pop-up informasi lengkap RTH.
              </div>
            )}
          </div>

          {/* Interactive List of RTH Points */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex-1 flex flex-col overflow-hidden max-h-[370px]">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <span className="text-xs font-extrabold text-slate-800">
                Daftar Titik pada Peta ({filteredLocations.length})
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Klik untuk fokus</span>
            </div>
            <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
              {filteredLocations.map((loc) => {
                const isSelected = selectedLocation?.id === loc.id;
                const badge = getRthCategoryColor(loc.jenisRth, loc.namaFasilitas);
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handlePointSelect(loc)}
                    className={`w-full text-left px-4 py-2.5 transition-colors flex items-start justify-between gap-2 cursor-pointer ${
                      isSelected ? 'bg-emerald-50/90' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: badge.bg }}
                        />
                        <p className="text-xs font-bold text-slate-900 truncate">
                          #{loc.no} {loc.namaFasilitas}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 pl-4">
                        {loc.jenisRth} • Kec. {loc.kecamatan}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-emerald-700">
                        {loc.luasM2.toLocaleString('id-ID')} m²
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Data Visualizations Row (Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Chart 1: Proporsi Luas per Jenis RTH */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Proporsi Luas per Jenis RTH
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Perbandingan total luas (m²) berdasarkan kategori RTH
            </p>
          </div>

          <div className="h-56 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.byJenis.filter((d) => d.luasM2 > 0)}
                  dataKey="luasM2"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={82}
                  paddingAngle={3}
                >
                  {stats.byJenis
                    .filter((d) => d.luasM2 > 0)
                    .map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [
                    `${Number(value).toLocaleString('id-ID')} m² (${(Number(value) / 10000).toFixed(2)} Ha)`,
                    'Luas RTH',
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            {stats.byJenis.map((item) => {
              const pct =
                stats.totalLuasM2 > 0
                  ? ((item.luasM2 / stats.totalLuasM2) * 100).toFixed(1)
                  : '0.0';
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-bold text-slate-700">{item.name}</span>
                    <span className="text-slate-400 font-semibold">({item.count} titik)</span>
                  </div>
                  <div className="font-extrabold text-slate-900">
                    {item.luasM2.toLocaleString('id-ID')} m²{' '}
                    <span className="text-emerald-700">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Sebaran Titik RTH per Kecamatan */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Sebaran Titik RTH per Kecamatan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Jumlah titik lokasi fasilitas RTH di setiap kecamatan
            </p>
          </div>

          <div className="h-80 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.byKecamatan}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="kecamatan"
                  width={115}
                  tick={{ fontSize: 11, fontWeight: 600 }}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    name === 'count' ? `${value} Titik Lokasi` : `${Number(value).toLocaleString('id-ID')} m²`,
                    name === 'count' ? 'Jumlah Titik' : 'Total Luas',
                  ]}
                />
                <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Top 10 Fasilitas RTH Terluas */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              10 Fasilitas RTH Terluas di Pekanbaru
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Klik baris fasilitas untuk langsung melihat lokasinya di peta
            </p>
          </div>

          <div className="space-y-2 mt-3 flex-1 overflow-y-auto max-h-80 pr-1">
            {stats.top10Largest.map((loc, index) => {
              const maxLuas = stats.top10Largest[0]?.luasM2 || 1;
              const barWidth = Math.max(6, Math.round((loc.luasM2 / maxLuas) * 100));
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => handlePointSelect(loc)}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <span className="font-bold text-slate-900 truncate">
                        {loc.namaFasilitas}
                      </span>
                    </div>
                    <span className="font-extrabold text-emerald-700 shrink-0">
                      {loc.luasM2.toLocaleString('id-ID')} m²
                    </span>
                  </div>
                  <div className="w-full bg-slate-200/70 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Complete Interactive Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Tabel Master Data RTH Kota Pekanbaru Tahun 2025
            </h2>
            <p className="text-xs text-slate-500">
              Menampilkan {filteredLocations.length} dari {RTH_DATA_2025.length} titik fasilitas RTH. Klik baris untuk memunculkan pop-up lokasi pada peta.
            </p>
          </div>
          <div className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl">
            Total Luas Terfilter: {stats.totalLuasM2.toLocaleString('id-ID')} m² ({stats.totalLuasHa.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Ha)
          </div>
        </div>

        <div className="overflow-x-auto max-h-[520px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-600">
              <tr>
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Jenis RTH</th>
                <th className="py-3 px-4">Nama Fasilitas</th>
                <th className="py-3 px-4">Alamat & Kecamatan</th>
                <th className="py-3 px-4">Titik Koordinat (Lat / Long)</th>
                <th className="py-3 px-4">Kepemilikan</th>
                <th className="py-3 px-4 text-right">Luas RTH (m²)</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLocations.map((loc) => {
                const isSelected = selectedLocation?.id === loc.id;
                const badge = getRthCategoryColor(loc.jenisRth, loc.namaFasilitas);
                return (
                  <tr
                    key={loc.id}
                    onClick={() => handlePointSelect(loc)}
                    className={`transition-colors cursor-pointer ${
                      isSelected ? 'bg-emerald-50/90' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-700">#{loc.no}</td>
                    <td className="py-3 px-4">
                      <span
                        className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold"
                        style={{ backgroundColor: badge.badgeBg, color: badge.badgeText }}
                      >
                        {loc.jenisRth}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">
                      {loc.namaFasilitas}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs">
                      <div className="font-medium text-slate-800">{loc.alamat}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Kecamatan: <strong>{loc.kecamatan}</strong>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                      <div>{loc.latDms}, {loc.lngDms}</div>
                      <div className="text-slate-400">
                        ({loc.lat}, {loc.lng})
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {loc.kepemilikan}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-700">
                      {loc.luasM2.toLocaleString('id-ID')} m²
                    </td>
                    <td
                      className="py-3 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            handlePointSelect(loc);
                            window.scrollTo({ top: 220, behavior: 'smooth' });
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                        >
                          🎯 Fokus Peta
                        </button>
                        <button
                          type="button"
                          onClick={() => setDetailModalLocation(loc)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer"
                        >
                          ℹ️ Detail
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Pop-up Detail Titik RTH */}
      {detailModalLocation && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setDetailModalLocation(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  {detailModalLocation.jenisRth} • No. #{detailModalLocation.no}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                  {detailModalLocation.namaFasilitas}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalLocation(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-xs sm:text-sm border border-slate-200/60">
              <div>
                <span className="font-bold text-slate-500 block text-xs uppercase">Alamat Lengkap</span>
                <span className="font-semibold text-slate-800">{detailModalLocation.alamat}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/70">
                <div>
                  <span className="font-bold text-slate-500 block text-xs uppercase">Kecamatan</span>
                  <span className="font-bold text-slate-900">{detailModalLocation.kecamatan}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 block text-xs uppercase">Status Kepemilikan</span>
                  <span className="font-bold text-slate-900">{detailModalLocation.kepemilikan}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/70">
                <div>
                  <span className="font-bold text-slate-500 block text-xs uppercase">Luas Area (m²)</span>
                  <span className="text-base font-black text-emerald-700">
                    {detailModalLocation.luasM2.toLocaleString('id-ID')} m²
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 block text-xs uppercase">Luas Area (Hektar)</span>
                  <span className="text-base font-black text-emerald-700">
                    {(detailModalLocation.luasM2 / 10000).toLocaleString('id-ID', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4,
                    })}{' '}
                    Ha
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/70">
                <span className="font-bold text-slate-500 block text-xs uppercase">Titik Koordinat</span>
                <div className="font-mono font-bold text-slate-800 mt-0.5">
                  DMS: {detailModalLocation.latDms}, {detailModalLocation.lngDms}
                </div>
                <div className="font-mono text-xs text-slate-600">
                  Desimal: {detailModalLocation.lat}, {detailModalLocation.lng}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <a
                href={`https://www.google.com/maps?q=${detailModalLocation.lat},${detailModalLocation.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm"
              >
                🗺️ Buka di Google Maps
              </a>
              <button
                type="button"
                onClick={() => setDetailModalLocation(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
