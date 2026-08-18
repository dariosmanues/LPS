import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

// Helper to parse excel dates
function parseExcelDate(serial: number | string | null): Date | null {
    if (!serial) return null;

    // If it's already a string that looks like a date
    if (typeof serial === 'string') {
        const trimmed = serial.trim();

        // Handle Indonesian months e.g. "05 Januari 2026"
        const monthsMap: { [key: string]: number } = {
            'januari': 0, 'februari': 1, 'maret': 2,
            'april': 3, 'mei': 4, 'juni': 5,
            'juli': 6, 'agustus': 7, 'september': 8,
            'oktober': 9, 'november': 10, 'desember': 11,
            // Also English months
            'january': 0, 'february': 1, 'march': 2,
            'may': 4, 'june': 5, 'july': 6,
            'august': 7, 'october': 9, 'december': 11
        };

        // Try to parse "DD Month YYYY" format
        const parts = trimmed.split(/\s+/);
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const monthLower = parts[1].toLowerCase();
            const year = parseInt(parts[2], 10);

            if (!isNaN(day) && !isNaN(year) && monthsMap[monthLower] !== undefined) {
                return new Date(year, monthsMap[monthLower], day);
            }
        }

        // Fallback: try standard date parsing
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) return d;
        return null;
    }

    // Excel serial date to JS Date
    // Excel base date is Dec 30 1899
    if (typeof serial === 'number') {
        const utc_days = Math.floor(serial - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);
        return date_info;
    }

    return null;
}

// Helper to extract values from Excel row using flexible key matching
function getFlexibleValue(row: Record<string, any>, possibleKeys: string[]): any {
    if (!row || typeof row !== 'object') return undefined;

    // 1. Direct exact key lookup
    for (const key of possibleKeys) {
        if (row[key] !== undefined && row[key] !== null) {
            const val = row[key];
            if (typeof val === 'string') {
                const trimmed = val.trim();
                if (trimmed !== '') return trimmed;
            } else {
                return val;
            }
        }
    }

    // 2. Normalized key lookup (lowercase, remove spaces & non-alphanumeric)
    const rowKeys = Object.keys(row);
    const keyMap = new Map<string, string>();
    for (const rKey of rowKeys) {
        const cleanRKey = rKey.toLowerCase().replace(/[^a-z0-9]/g, '');
        keyMap.set(cleanRKey, rKey);
    }

    for (const pKey of possibleKeys) {
        const cleanPKey = pKey.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (keyMap.has(cleanPKey)) {
            const actualKey = keyMap.get(cleanPKey)!;
            const val = row[actualKey];
            if (val !== undefined && val !== null) {
                if (typeof val === 'string') {
                    const trimmed = val.trim();
                    if (trimmed !== '') return trimmed;
                } else {
                    return val;
                }
            }
        }
    }

    // 3. Substring match: ONLY check if cleanRKey (Excel header) contains cleanPKey (candidate)
    // NEVER check cleanPKey.includes(cleanRKey), because candidate keys like 'No Pol' would falsely match column 'No' or 'No Izin'
    for (const pKey of possibleKeys) {
        const cleanPKey = pKey.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanPKey.length < 4) continue;
        for (const [cleanRKey, actualKey] of keyMap.entries()) {
            if (cleanRKey.includes(cleanPKey)) {
                const val = row[actualKey];
                if (val !== undefined && val !== null) {
                    if (typeof val === 'string') {
                        const trimmed = val.trim();
                        if (trimmed !== '') return trimmed;
                    } else {
                        return val;
                    }
                }
            }
        }
    }

    return undefined;
}

function normalizeTransdepo(val: any): string | null {
    if (!val) return null;
    const str = val.toString().toUpperCase();
    if (str.includes('HAM') || str.includes('AIR')) return 'AIRHITAM';
    if (str.includes('HARAPAN')) return 'HARAPANJAYA';
    return str;
}

function normalizeJenis(val: any): string | null {
    if (!val) return null;
    const str = val.toString().toUpperCase();
    if (str.includes('PICK')) return 'PICKUP';
    if (str.includes('DUMP') || str.includes('TRUCK')) return 'DUMPTRUCK';
    if (str.includes('BENTOR') || str.includes('MOTOR')) return 'BENTOR';
    return str;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Auto-detect header row index (in case file has title or blank rows at the top)
        const rawMatrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];
        let headerRowIndex = 0;
        for (let r = 0; r < Math.min(rawMatrix.length, 10); r++) {
            const rowCells = rawMatrix[r];
            if (!Array.isArray(rowCells)) continue;
            const rowStr = rowCells.map(c => String(c).toLowerCase()).join(' ');
            if (
                (rowStr.includes('polisi') || rowStr.includes('plat')) &&
                (rowStr.includes('lps') || rowStr.includes('izin') || rowStr.includes('supir') || rowStr.includes('armada'))
            ) {
                headerRowIndex = r;
                break;
            }
        }

        const jsonData = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex });

        const stats = {
            total: jsonData.length,
            updated: 0,
            created: 0,
            errors: 0,
            details: [] as string[]
        };

        // Pre-fetch all kelurahans and armadas to minimize DB calls and ensure 100% reliable matching
        const allKelurahan = await prisma.kelurahan.findMany({
            include: { kecamatan: true }
        });

        const kelurahanMap = new Map();
        allKelurahan.forEach(k => {
            kelurahanMap.set(k.nama.toLowerCase().trim(), k.id);
        });

        const allArmada = await prisma.armada.findMany();
        const armadaMapByPlat = new Map<string, typeof allArmada[0]>();
        const armadaMapByNoIzin = new Map<string, typeof allArmada[0]>();

        allArmada.forEach(a => {
            const cleanPlatKey = a.platNomor.replace(/\s+/g, '').toUpperCase();
            armadaMapByPlat.set(cleanPlatKey, a);
            if (a.noIzinOperasi) {
                armadaMapByNoIzin.set(a.noIzinOperasi.trim().toUpperCase(), a);
            }
        });

        for (let i = 0; i < (jsonData as any[]).length; i++) {
            const row = (jsonData as any[])[i];
            const rowNum = i + 2; // +2 because row 1 is header, array is 0-indexed
            try {
                const platNomorRaw = getFlexibleValue(row, ["Nomor Polisi", "Plat Nomor", "platNomor", "No Polisi", "Nomor Pol", "Plat Mobil", "Plat"]);

                if (!platNomorRaw) {
                    stats.errors++;
                    const namaLps = getFlexibleValue(row, ["nama lps", "Nama LPS", "Nama LPS 2", "LPS"]) || '(kosong)';
                    stats.details.push(`Baris ${rowNum}: Kolom 'Nomor Polisi' kosong (LPS: ${namaLps})`);
                    continue;
                }

                const cleanPlatStr = platNomorRaw.toString().replace(/\s+/g, ' ').trim().toUpperCase();
                const platKey = cleanPlatStr.replace(/\s+/g, '');

                // Safe mapping using flexible key matching
                const namaLps = getFlexibleValue(row, ["nama lps", "Nama LPS", "Nama LPS 2", "LPS"]) || "LPS Unknown";
                const namaSupir = getFlexibleValue(row, ["Nama Supir", "supir", "Nama Driver", "Driver", "nama_supir", "driver_name", "Nama Pengemudi", "Pengemudi"]);
                const kelurahanName = getFlexibleValue(row, ["Kelurahan LPS", "Kelurahan", "Kelurahan/Desa"]);
                const noIzinOperasi = getFlexibleValue(row, ["Nomor izin", "No Izin", "Nomor Izin Operasi", "No Izin Operasional", "No. Izin", "Nomor Izin"]);
                const nomorSkLps = getFlexibleValue(row, ["Nomor SK LPS", "No SK LPS", "Nomor SK", "No SK", "No. SK LPS"]);
                const namaKetuaLps = getFlexibleValue(row, ["Nama Ketua LPS", "Ketua LPS", "Nama Ketua", "Ketua"]);
                const alamatLps = getFlexibleValue(row, ["Alamat LPS", "Alamat", "Alamat Lengkap"]);
                const wilayahKerja = getFlexibleValue(row, ["Wilayah Kerja", "Wilayah", "Wilayah Operasional"]);
                const lokasiTransdepoRaw = getFlexibleValue(row, ["Lokasi TPS Wilayah", "Lokasi TPS", "Transdepo", "Lokasi Transdepo", "Lokasi Depo"]);
                const jenisArmadaRaw = getFlexibleValue(row, ["Jenis Armada", "Jenis", "Tipe Armada"]);

                const tglTerbitRaw = getFlexibleValue(row, [
                    "tanggal Terbit Izin opersional",
                    "Tanggal Terbit Izin Operasional",
                    "Tanggal Terbit Izin",
                    "tanggal terbit izin",
                    "Tgl Terbit Izin",
                    "Tanggal Terbit"
                ]);

                const tglSkRaw = getFlexibleValue(row, [
                    "Tanggal Sk LPS",
                    "Tanggal SK LPS",
                    "Tgl SK LPS",
                    "Tanggal SK"
                ]);

                // Match Kelurahan
                let kelurahanId = null;
                if (kelurahanName && kelurahanMap.has(kelurahanName.toString().toLowerCase().trim())) {
                    kelurahanId = kelurahanMap.get(kelurahanName.toString().toLowerCase().trim());
                }

                const parsedTanggalTerbitIzin = parseExcelDate(tglTerbitRaw);
                const parsedTanggalSkLps = parseExcelDate(tglSkRaw);

                const dataToSave: any = {
                    namaLps: namaLps.toString().trim(),
                    platNomor: cleanPlatStr,
                    isActive: true,
                };

                // Save non-null/valid fields
                if (noIzinOperasi) dataToSave.noIzinOperasi = noIzinOperasi.toString().trim();
                if (nomorSkLps) dataToSave.nomorSkLps = nomorSkLps.toString().trim();
                if (parsedTanggalSkLps) dataToSave.tanggalSkLps = parsedTanggalSkLps;
                if (namaKetuaLps) dataToSave.namaKetuaLps = namaKetuaLps.toString().trim();
                if (alamatLps) dataToSave.alamatLps = alamatLps.toString().trim();
                if (wilayahKerja) dataToSave.wilayahKerja = wilayahKerja.toString().trim();
                if (lokasiTransdepoRaw) dataToSave.lokasiTransdepo = normalizeTransdepo(lokasiTransdepoRaw);
                if (jenisArmadaRaw) dataToSave.jenisArmada = normalizeJenis(jenisArmadaRaw);
                if (parsedTanggalTerbitIzin) dataToSave.tanggalTerbitIzin = parsedTanggalTerbitIzin;
                if (namaSupir && namaSupir.toString().trim() !== '' && namaSupir.toString().trim() !== '-') {
                    dataToSave.namaSupir = namaSupir.toString().trim();
                }
                if (kelurahanId) dataToSave.kelurahanId = kelurahanId;

                // Match existing record by plat (space-insensitive) or by noIzinOperasi
                let existing = armadaMapByPlat.get(platKey);
                if (!existing && noIzinOperasi) {
                    const noIzinKey = noIzinOperasi.toString().trim().toUpperCase();
                    existing = armadaMapByNoIzin.get(noIzinKey);
                }

                if (existing) {
                    await prisma.armada.update({
                        where: { id: existing.id },
                        data: dataToSave
                    });
                    stats.updated++;
                } else {
                    // For new records, add qrCode
                    dataToSave.qrCode = platKey;
                    const createdRecord = await prisma.armada.create({
                        data: dataToSave
                    });
                    // Add to map for subsequent rows
                    armadaMapByPlat.set(platKey, createdRecord);
                    if (createdRecord.noIzinOperasi) {
                        armadaMapByNoIzin.set(createdRecord.noIzinOperasi.trim().toUpperCase(), createdRecord);
                    }
                    stats.created++;
                }

            } catch (err: any) {
                console.error(`Row ${rowNum} Error:`, err);
                stats.errors++;
                const platInfo = row["Nomor Polisi"] || row["platNomor"] || row["Plat Nomor"] || '(kosong)';
                stats.details.push(`Baris ${rowNum} (Plat: ${platInfo}): ${err.message}`);
            }
        }

        return NextResponse.json({
            message: "Import processed",
            stats
        });

    } catch (error: any) {
        console.error("Import Error:", error);
        return NextResponse.json(
            { error: "Failed to process import: " + error.message },
            { status: 500 }
        );
    }
}
