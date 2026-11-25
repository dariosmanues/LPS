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
import {
  RTH_TREE_LOCATIONS_2026,
  RTH_TREE_SPECIES_SUMMARY_2026,
  RTH_TREE_SUMMARY_2026,
  type RthTreeLocation,
} from '@/lib/rth-tree-data';

const RthInteractiveMap = dynamic(() => import('@/components/rth/RthInteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[540px] lg:h-[620px] rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col items-center justify-center gap-3 animate-pulse">
      <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 flex items-center justify-center text-2xl">
        🌳
      </div>
      <p className="text-sm font-bold text-emerald-800">
        Memuat Peta Interaktif RTH & Sebaran Pohon Kota Pekanbaru...
      </p>
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
  const [mapLayerMode, setMapLayerMode] = useState<'all' | 'rth' | 'pohon'>('all');

  const [selectedLocation, setSelectedLocation] = useState<RthLocation | null>(null);
  const [selectedTreeLocation, setSelectedTreeLocation] = useState<RthTreeLocation | null>(null);
  const [detailModalLocation, setDetailModalLocation] = useState<RthLocation | null>(null);
  const [copiedCoordId, setCopiedCoordId] = useState<string | null>(null);

  // Filters for Rekap Data Pohon 2026 section
  const [treeSearchQuery, setTreeSearchQuery] = useState('');
  const [selectedSpeciesFilter, setSelectedSpeciesFilter] = useState<string>('ALL');

  const kecamatanOptions = useMemo(() => {
    const set = new Set<string>();
    RTH_DATA_2025.forEach((item) => {
      if (item.kecamatan) set.add(item.kecamatan);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, []);

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

  // Filtered 2026 Tree Inventory Locations
  const filteredTreeLocations = useMemo(() => {
    const q = treeSearchQuery.trim().toLowerCase();
    return RTH_TREE_LOCATIONS_2026.filter((loc) => {
      if (selectedSpeciesFilter !== 'ALL') {
        const hasSp = loc.trees.some((t) => t.jenisPohon === selectedSpeciesFilter);
        if (!hasSp) return false;
      }
      if (q) {
        const speciesText = loc.trees.map((t) => t.jenisPohon).join(' ');
        const hay = `${loc.excelNo} ${loc.namaJalan} ${loc.alamat} ${loc.kecamatan} ${speciesText}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [treeSearchQuery, selectedSpeciesFilter]);

  const filteredTreeStats = useMemo(() => {
    let totalPohon = 0;
    const spMap = new Map<string, number>();
    filteredTreeLocations.forEach((loc) => {
      loc.trees.forEach((t) => {
        if (selectedSpeciesFilter === 'ALL' || t.jenisPohon === selectedSpeciesFilter) {
          totalPohon += t.jumlah;
          spMap.set(t.jenisPohon, (spMap.get(t.jenisPohon) || 0) + t.jumlah);
        }
      });
    });
    return {
      totalPohon,
      uniqueSpeciesCount: spMap.size,
    };
  }, [filteredTreeLocations, selectedSpeciesFilter]);

  const stats = useMemo(() => {
    const totalTitik = filteredLocations.length;
    const totalLuasM2 = filteredLocations.reduce((acc, r) => acc + r.luasM2, 0);
    const totalLuasHa = totalLuasM2 / 10000;

    const byJenisMap = new Map<
      string,
      { name: string; count: number; luasM2: number; luasHa: number; color: string }
    >();
    ['Taman Kota', 'Jalur Hijau Di Jalan', 'Hutan Kota', 'Kebun Bibit'].forEach((j) => {
      byJenisMap.set(j, {
        name: j,
        count: 0,
        luasM2: 0,
        luasHa: 0,
        color: JENIS_COLORS[j] || '#10b981',
      });
    });

    const byKecMap = new Map<
      string,
      { kecamatan: string; count: number; luasM2: number; luasHa: number }
    >();

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
    });

    const byJenis = Array.from(byJenisMap.values());
    const byKecamatan = Array.from(byKecMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
    const top10Largest = [...filteredLocations]
      .sort((a, b) => b.luasM2 - a.luasM2)
      .slice(0, 10);

    return {
      totalTitik,
      totalLuasM2,
      totalLuasHa,
      byJenis,
      byKecamatan,
      top10Largest,
    };
  }, [filteredLocations]);

  const handlePointSelect = (loc: RthLocation) => {
    setSelectedTreeLocation(null);
    setSelectedLocation(loc);
  };

  const handleTreePointSelect = (treeLoc: RthTreeLocation) => {
    if (treeLoc.rthNo !== null) {
      const matchedRth = RTH_DATA_2025.find((r) => r.no === treeLoc.rthNo);
      if (matchedRth && mapLayerMode !== 'pohon') {
        setSelectedTreeLocation(treeLoc);
        setSelectedLocation(matchedRth);
        return;
      }
    }
    setSelectedLocation(null);
    setSelectedTreeLocation(treeLoc);
  };

  const handleCopyCoord = (lat: number, lng: number, id: string) => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    setCopiedCoordId(id);
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

  const handleExportTreeCsv = () => {
    const headers = [
      'No Ruas',
      'Nama Jalan / Lokasi RTH',
      'Kecamatan',
      'Jenis Pohon',
      'Jumlah Pohon',
      'Total Pohon di Ruas Ini',
    ];
    const rows: Array<Array<string | number>> = [];
    filteredTreeLocations.forEach((loc) => {
      loc.trees.forEach((t) => {
        if (selectedSpeciesFilter === 'ALL' || t.jenisPohon === selectedSpeciesFilter) {
          rows.push([
            loc.excelNo,
            `"${loc.namaJalan.replace(/"/g, '""')}"`,
            `"${loc.kecamatan}"`,
            `"${t.jenisPohon}"`,
            t.jumlah,
            loc.totalPohon,
          ]);
        }
      });
    });
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `REKAP_DATA_POHON_DLHK_PEKANBARU_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const linkedTreesForSelectedRth = useMemo(() => {
    if (!selectedLocation) return [];
    return RTH_TREE_LOCATIONS_2026.filter((t) => t.rthNo === selectedLocation.no);
  }, [selectedLocation]);

  return (
    <div className="space-y-6 pb-10">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-emerald-900 via-emerald-800 to-teal-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold uppercase tracking-wider">
              <span>🌳</span> Bidang Pertamanan • DLHK Kota Pekanbaru (RTH 2025 & Inventaris Pohon 2026)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Dashboard Ruang Terbuka Hijau (RTH) & Rekapitulasi Pohon
            </h1>
            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
              Visualisasi pemetaan geospasial interaktif untuk <strong>155 titik fasilitas RTH</strong> (`1.771.237 m²`) serta <strong>Rekapitulasi Pendataan 17.196 Pohon Tahun 2026</strong> pada <strong>36 ruas jalan & taman kota</strong> yang dikelola oleh DLHK Kota Pekanbaru.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <span>📥</span> Unduh Data RTH (CSV)
            </button>
            <button
              type="button"
              onClick={handleExportTreeCsv}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <span>🌳</span> Unduh Rekap Pohon 2026 (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* Top KPI Cards (5 Cards including 2026 Tree Inventory) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Titik RTH
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {stats.totalTitik.toLocaleString('id-ID')}
              <span className="text-sm font-bold text-slate-500 ml-1.5">Titik</span>
            </p>
            <p className="text-xs text-emerald-700 font-semibold mt-1.5">
              Dari {RTH_DATA_2025.length} fasilitas RTH DLHK
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl shrink-0">
            📍
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Luas RTH DLHK
            </p>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              {(selectedJenis === 'ALL' &&
              selectedKecamatan === 'ALL' &&
              selectedKepemilikan === 'ALL' &&
              !searchQuery
                ? RTH_OFFICIAL_SUMMARY.luasRthDikelolaM2
                : stats.totalLuasM2
              ).toLocaleString('id-ID')}
              <span className="text-xs font-bold text-slate-500 ml-1">m²</span>
            </p>
            <p className="text-xs text-slate-600 font-semibold mt-1.5">
              Setara{' '}
              <strong>
                {(selectedJenis === 'ALL' &&
                selectedKecamatan === 'ALL' &&
                selectedKepemilikan === 'ALL' &&
                !searchQuery
                  ? RTH_OFFICIAL_SUMMARY.luasRthDikelolaM2 / 10000
                  : stats.totalLuasHa
                ).toLocaleString('id-ID', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                Ha
              </strong>
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center text-xl shrink-0">
            🌿
          </div>
        </div>

        {/* NEW KPI CARD: Total Pohon Terdata 2026 */}
        <div className="bg-linear-to-br from-green-50 to-emerald-50/70 rounded-2xl p-5 border border-green-200 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-green-800">
              Total Pohon Terdata (2026)
            </p>
            <p className="text-3xl font-black text-green-800 mt-1">
              {RTH_TREE_SUMMARY_2026.totalPohon.toLocaleString('id-ID')}
              <span className="text-xs font-bold text-green-700 ml-1.5">Pohon</span>
            </p>
            <p className="text-xs text-green-800 font-semibold mt-1.5">
              <strong>{RTH_TREE_SUMMARY_2026.totalLokasiJalan} Ruas Jalan/RTH</strong> •{' '}
              {RTH_TREE_SUMMARY_2026.totalJenisPohon} Jenis
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-green-600 text-white flex items-center justify-center text-xl shrink-0 shadow-xs">
            🌳
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Rasio Luas Kota
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {RTH_OFFICIAL_SUMMARY.persentaseRthDikelola.toLocaleString('id-ID')}%
            </p>
            <p className="text-xs text-slate-600 font-semibold mt-1.5">
              Luas Kota: <strong>63.899,59 Ha</strong>
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl shrink-0">
            🗺️
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Kategori RTH
            </p>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              4 Jenis
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
                onClick={() => {
                  setSelectedJenis(tab.id);
                  if (mapLayerMode === 'pohon') setMapLayerMode('all');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedJenis === tab.id && mapLayerMode !== 'pohon'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() =>
                setMapLayerMode((m) => (m === 'pohon' ? 'all' : 'pohon'))
              }
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                mapLayerMode === 'pohon'
                  ? 'bg-green-700 text-white shadow-sm ring-2 ring-green-300'
                  : 'bg-green-50 text-green-800 border border-green-200 hover:bg-green-100'
              }`}
            >
              🌳 Mode Peta Pohon 2026 (36 Ruas • 17.196 Pohon)
            </button>
          </div>

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
        <div className="xl:col-span-8 flex flex-col">
          <RthInteractiveMap
            locations={filteredLocations}
            treeLocations={filteredTreeLocations}
            selectedLocation={selectedLocation}
            selectedTreeLocation={selectedTreeLocation}
            onSelectLocation={handlePointSelect}
            onSelectTreeLocation={handleTreePointSelect}
            showAreaCircles={showAreaCircles}
            mapLayerMode={mapLayerMode}
            onChangeMapLayerMode={setMapLayerMode}
          />
        </div>

        {/* Right Side: Selected Point Detail Card + Scrollable Point Selector */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                📌 Detail Titik RTH / Pohon Terpilih
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
                      ({(selectedLocation.luasM2 / 10000).toLocaleString('id-ID', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}{' '}
                      Ha)
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

                {/* Linked 2026 Tree Inventory Breakdown if available */}
                {linkedTreesForSelectedRth.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-green-800 uppercase">
                        🌳 Inventaris Pohon 2026
                      </span>
                      <span className="text-xs font-black text-green-800 bg-green-200/70 px-2 py-0.5 rounded-full">
                        {linkedTreesForSelectedRth
                          .reduce((acc, r) => acc + r.totalPohon, 0)
                          .toLocaleString('id-ID')}{' '}
                        Pohon
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {linkedTreesForSelectedRth.flatMap((tr) =>
                        tr.trees.map((sp) => (
                          <span
                            key={`${tr.id}-${sp.jenisPohon}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-green-200 text-[11px] font-semibold text-green-900"
                          >
                            {sp.jenisPohon}: <strong>{sp.jumlah.toLocaleString('id-ID')}</strong>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                )}

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
                    onClick={() =>
                      handleCopyCoord(selectedLocation.lat, selectedLocation.lng, selectedLocation.id)
                    }
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    {copiedCoordId === selectedLocation.id ? '✅ Tersalin' : '📋 Salin Koordinat'}
                  </button>
                </div>
              </div>
            ) : selectedTreeLocation ? (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-800">
                      🌳 Rekap Data Pohon 2026
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Ruas #{selectedTreeLocation.excelNo}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {selectedTreeLocation.namaJalan}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    📍 {selectedTreeLocation.alamat} (Kec. {selectedTreeLocation.kecamatan})
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-green-800 uppercase">
                      Total Pohon ({selectedTreeLocation.trees.length} Jenis)
                    </span>
                    <span className="text-sm font-black text-green-800">
                      {selectedTreeLocation.totalPohon.toLocaleString('id-ID')} Pohon
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {selectedTreeLocation.trees.map((sp) => (
                      <span
                        key={sp.jenisPohon}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-green-200 text-[11px] font-semibold text-green-900"
                      >
                        {sp.jenisPohon}: <strong>{sp.jumlah.toLocaleString('id-ID')}</strong>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.google.com/maps?q=${selectedTreeLocation.lat},${selectedTreeLocation.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-2 px-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-xs transition-colors"
                  >
                    🗺️ Google Maps
                  </a>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                Klik salah satu titik RTH atau titik Pohon pada peta untuk menampilkan pop-up informasi lengkap fasilitas & rincian jenis pohon.
              </div>
            )}
          </div>

          {/* Interactive List of RTH / Tree Points */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex-1 flex flex-col overflow-hidden max-h-[370px]">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <span className="text-xs font-extrabold text-slate-800">
                {mapLayerMode === 'pohon'
                  ? `Daftar Ruas Jalan Pohon (${filteredTreeLocations.length})`
                  : `Daftar Titik RTH (${filteredLocations.length})`}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Klik untuk fokus</span>
            </div>
            <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
              {mapLayerMode === 'pohon'
                ? filteredTreeLocations.map((tLoc) => {
                    const isSelected = selectedTreeLocation?.id === tLoc.id;
                    return (
                      <button
                        key={tLoc.id}
                        type="button"
                        onClick={() => handleTreePointSelect(tLoc)}
                        className={`w-full text-left px-4 py-2.5 transition-colors flex items-start justify-between gap-2 cursor-pointer ${
                          isSelected ? 'bg-green-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            🌳 #{tLoc.excelNo} {tLoc.namaJalan}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {tLoc.trees.length} Jenis Pohon • Kec. {tLoc.kecamatan}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-extrabold text-green-700">
                            {tLoc.totalPohon.toLocaleString('id-ID')} pohon
                          </span>
                        </div>
                      </button>
                    );
                  })
                : filteredLocations.map((loc) => {
                    const isSelected = selectedLocation?.id === loc.id;
                    const badge = getRthCategoryColor(loc.jenisRth, loc.namaFasilitas);
                    const linkedTreeCount = RTH_TREE_LOCATIONS_2026.filter(
                      (t) => t.rthNo === loc.no
                    ).reduce((a, b) => a + b.totalPohon, 0);
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
                            {linkedTreeCount > 0 ? ` • 🌳 ${linkedTreeCount.toLocaleString('id-ID')} pohon` : ''}
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

      {/* ===================================================================== */}
      {/* NEW SECTION: REKAPITULASI PENDATAAN POHON BIDANG PERTAMANAN DLHK 2026 */}
      {/* ===================================================================== */}
      <div className="bg-linear-to-br from-green-900 via-emerald-900 to-teal-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-white/15 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-400/20 border border-green-300/30 text-green-200 text-xs font-bold uppercase tracking-wider mb-2">
              <span>🌳</span> Rekapitulasi Pendataan Pohon • Bidang Pertamanan DLHK 2026
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold">
              Inventaris & Sebaran Jenis Pohon Kota Pekanbaru (Tahun 2026)
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/85 mt-1">
              Total <strong>{RTH_TREE_SUMMARY_2026.totalPohon.toLocaleString('id-ID')} pohon</strong> terdata di{' '}
              <strong>{RTH_TREE_SUMMARY_2026.totalLokasiJalan} ruas jalan & taman RTH</strong> dengan{' '}
              <strong>{RTH_TREE_SUMMARY_2026.totalJenisPohon} jenis/spesies pohon</strong>. Klik pada ruas jalan untuk langsung melihat titik & pop-up rincian pohonnya di peta.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl px-4 py-2.5 text-center">
              <div className="text-[10px] uppercase font-bold text-emerald-200">Total Pohon</div>
              <div className="text-xl font-black text-white">
                {RTH_TREE_SUMMARY_2026.totalPohon.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl px-4 py-2.5 text-center">
              <div className="text-[10px] uppercase font-bold text-emerald-200">Ruas Jalan/RTH</div>
              <div className="text-xl font-black text-white">
                {RTH_TREE_SUMMARY_2026.totalLokasiJalan}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl px-4 py-2.5 text-center">
              <div className="text-[10px] uppercase font-bold text-emerald-200">Jenis Pohon</div>
              <div className="text-xl font-black text-white">
                {RTH_TREE_SUMMARY_2026.totalJenisPohon}
              </div>
            </div>
          </div>
        </div>

        {/* 2 Charts for Tree Inventory 2026 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Top 12 Tree Species */}
          <div className="lg:col-span-6 bg-white text-slate-900 rounded-2xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Top 12 Jenis Pohon Terbanyak (2026)
                </h3>
                <p className="text-xs text-slate-500">
                  Klik batang grafik atau tombol jenis pohon untuk memfilter ruas jalan
                </p>
              </div>
              {selectedSpeciesFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedSpeciesFilter('ALL')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold cursor-pointer"
                >
                  Reset Filter ({selectedSpeciesFilter}) ✕
                </button>
              )}
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={RTH_TREE_SPECIES_SUMMARY_2026.slice(0, 12)}
                  layout="vertical"
                  margin={{ top: 4, right: 24, left: 12, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="jenisPohon"
                    width={125}
                    tick={{ fontSize: 11, fontWeight: 700 }}
                  />
                  <Tooltip
                    formatter={(value: any) => [
                      `${Number(value).toLocaleString('id-ID')} Pohon`,
                      'Jumlah',
                    ]}
                  />
                  <Bar
                    dataKey="totalPohon"
                    fill="#15803d"
                    radius={[0, 6, 6, 0]}
                    onClick={(data: any) => {
                      if (data?.jenisPohon) {
                        setSelectedSpeciesFilter((prev) =>
                          prev === data.jenisPohon ? 'ALL' : data.jenisPohon
                        );
                      }
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top 12 Roads by Tree Count */}
          <div className="lg:col-span-6 bg-white text-slate-900 rounded-2xl p-5 shadow-md flex flex-col justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Ruas Jalan dengan Jumlah Pohon Terbanyak
              </h3>
              <p className="text-xs text-slate-500">
                Klik baris ruas jalan untuk fokus ke titik lokasi pada peta di atas
              </p>
            </div>

            <div className="space-y-2 mt-3 max-h-72 overflow-y-auto pr-1">
              {[...RTH_TREE_LOCATIONS_2026]
                .sort((a, b) => b.totalPohon - a.totalPohon)
                .slice(0, 12)
                .map((loc, idx) => {
                  const maxTrees = 2232;
                  const pct = Math.max(5, Math.round((loc.totalPohon / maxTrees) * 100));
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => {
                        handleTreePointSelect(loc);
                        window.scrollTo({ top: 220, behavior: 'smooth' });
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-green-50 border border-slate-100 hover:border-green-300 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-green-700 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-extrabold text-slate-900 truncate">
                            {loc.namaJalan}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            ({loc.trees.length} jenis)
                          </span>
                        </div>
                        <span className="font-black text-green-700 shrink-0">
                          {loc.totalPohon.toLocaleString('id-ID')} Pohon
                        </span>
                      </div>
                      <div className="w-full bg-slate-200/70 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="bg-green-600 h-full rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Interactive Table of All 36 Tree Locations & Species Breakdown */}
        <div className="bg-white text-slate-900 rounded-2xl overflow-hidden shadow-md">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Tabel Detail Rekapitulasi Pendataan Pohon per Ruas Jalan (2026)
              </h3>
              <p className="text-xs text-slate-500">
                Menampilkan {filteredTreeLocations.length} ruas jalan • Total{' '}
                <strong>{filteredTreeStats.totalPohon.toLocaleString('id-ID')} pohon</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="text"
                value={treeSearchQuery}
                onChange={(e) => setTreeSearchQuery(e.target.value)}
                placeholder="Cari nama jalan atau jenis pohon..."
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-green-600 min-w-[220px]"
              />
              <select
                value={selectedSpeciesFilter}
                onChange={(e) => setSelectedSpeciesFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                <option value="ALL">
                  Semua Jenis Pohon ({RTH_TREE_SPECIES_SUMMARY_2026.length} Jenis)
                </option>
                {RTH_TREE_SPECIES_SUMMARY_2026.map((sp) => (
                  <option key={sp.jenisPohon} value={sp.jenisPohon}>
                    {sp.jenisPohon} ({sp.totalPohon.toLocaleString('id-ID')} pohon di {sp.jumlahLokasi} jalan)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[480px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-600">
                <tr>
                  <th className="py-3 px-4 w-14">No</th>
                  <th className="py-3 px-4">Nama Jalan / Lokasi</th>
                  <th className="py-3 px-4">Kecamatan</th>
                  <th className="py-3 px-4">Rincian Jenis Pohon & Jumlah</th>
                  <th className="py-3 px-4 text-right">Total Pohon</th>
                  <th className="py-3 px-4 text-center">Peta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTreeLocations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-green-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-600">#{loc.excelNo}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 whitespace-nowrap">
                      {loc.namaJalan}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {loc.kecamatan}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {loc.trees.map((t) => {
                          const isHighlighted = selectedSpeciesFilter === t.jenisPohon;
                          return (
                            <span
                              key={t.jenisPohon}
                              onClick={() =>
                                setSelectedSpeciesFilter((prev) =>
                                  prev === t.jenisPohon ? 'ALL' : t.jenisPohon
                                )
                              }
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer transition-all ${
                                isHighlighted
                                  ? 'bg-green-700 text-white font-bold shadow-xs'
                                  : 'bg-green-50 text-green-900 border border-green-200 hover:bg-green-100'
                              }`}
                            >
                              <span>{t.jenisPohon}:</span>
                              <strong>{t.jumlah.toLocaleString('id-ID')}</strong>
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-green-700 whitespace-nowrap">
                      {loc.totalPohon.toLocaleString('id-ID')} Pohon
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          handleTreePointSelect(loc);
                          window.scrollTo({ top: 220, behavior: 'smooth' });
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-green-700 hover:bg-green-800 text-white font-bold text-[11px] cursor-pointer whitespace-nowrap"
                      >
                        🎯 Lihat di Peta
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Data Visualizations Row for RTH Area (Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
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
                    name === 'count'
                      ? `${value} Titik Lokasi`
                      : `${Number(value).toLocaleString('id-ID')} m²`,
                    name === 'count' ? 'Jumlah Titik' : 'Total Luas',
                  ]}
                />
                <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

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

      {/* Complete Interactive RTH Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Tabel Master Data RTH Kota Pekanbaru (155 Lokasi)
            </h2>
            <p className="text-xs text-slate-500">
              Menampilkan {filteredLocations.length} dari {RTH_DATA_2025.length} titik fasilitas RTH. Klik baris untuk memunculkan pop-up lokasi pada peta.
            </p>
          </div>
          <div className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl">
            Total Luas Terfilter: {stats.totalLuasM2.toLocaleString('id-ID')} m² (
            {stats.totalLuasHa.toLocaleString('id-ID', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            Ha)
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
                <th className="py-3 px-4">Data Pohon (2026)</th>
                <th className="py-3 px-4">Kepemilikan</th>
                <th className="py-3 px-4 text-right">Luas RTH (m²)</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLocations.map((loc) => {
                const isSelected = selectedLocation?.id === loc.id;
                const badge = getRthCategoryColor(loc.jenisRth, loc.namaFasilitas);
                const linkedTrees = RTH_TREE_LOCATIONS_2026.filter((t) => t.rthNo === loc.no);
                const totalPohon = linkedTrees.reduce((a, b) => a + b.totalPohon, 0);
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
                    <td className="py-3 px-4">
                      {totalPohon > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-800 font-extrabold text-[11px]">
                          🌳 {totalPohon.toLocaleString('id-ID')} Pohon
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
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
                <span className="font-bold text-slate-500 block text-xs uppercase">
                  Alamat Lengkap
                </span>
                <span className="font-semibold text-slate-800">{detailModalLocation.alamat}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/70">
                <div>
                  <span className="font-bold text-slate-500 block text-xs uppercase">
                    Kecamatan
                  </span>
                  <span className="font-bold text-slate-900">{detailModalLocation.kecamatan}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 block text-xs uppercase">
                    Status Kepemilikan
                  </span>
                  <span className="font-bold text-slate-900">
                    {detailModalLocation.kepemilikan}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/70">
                <div>
                  <span className="font-bold text-slate-500 block text-xs uppercase">
                    Luas Area (m²)
                  </span>
                  <span className="text-base font-black text-emerald-700">
                    {detailModalLocation.luasM2.toLocaleString('id-ID')} m²
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 block text-xs uppercase">
                    Luas Area (Hektar)
                  </span>
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
                <span className="font-bold text-slate-500 block text-xs uppercase">
                  Titik Koordinat
                </span>
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
