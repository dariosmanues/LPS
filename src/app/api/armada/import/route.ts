import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

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
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        const stats = {
            total: jsonData.length,
            updated: 0,
            created: 0,
            errors: 0,
            details: [] as string[]
        };

        // Pre-fetch all kelurahans to minimize DB calls
        const allKelurahan = await prisma.kelurahan.findMany({
            include: { kecamatan: true }
        });

        const kelurahanMap = new Map();
        allKelurahan.forEach(k => {
            // Map by name (lowercase for loose matching)
            kelurahanMap.set(k.nama.toLowerCase().trim(), k.id);
            // Also map by potential variations if needed
        });

        for (let i = 0; i < (jsonData as any[]).length; i++) {
            const row = (jsonData as any[])[i];
            const rowNum = i + 2; // +2 because row 1 is header, array is 0-indexed
            try {
                const platNomor = row["Nomor Polisi"] || row["platNomor"] || row["Plat Nomor"];

                if (!platNomor) {
                    stats.errors++;
                    const namaLps = row["nama lps"] || row["Nama LPS"] || row["Nama LPS 2"] || '(kosong)';
                    stats.details.push(`Baris ${rowNum}: Kolom 'Nomor Polisi' kosong (LPS: ${namaLps})`);
                    continue;
                }

                const normalizedPlat = platNomor.toString().trim().toUpperCase();

                // Safe mapping
                const namaLps = row["nama lps"] || row["Nama LPS"] || row["Nama LPS 2"] || "LPS Unknown";
                const namaSupir = row["Nama Supir"] || row["supir"] || "";
                const kelurahanName = row["Kelurahan LPS"] || row["Kelurahan"] || "";

                // Robust date field finding
                const tglTerbitRaw = row["tanggal Terbit Izin opersional"] ||
                    row["Tanggal Terbit Izin Operasional"] ||
                    row["Tanggal Terbit Izin"] ||
                    row["tanggal terbit izin"] || null;

                // Debug logging for first few rows
                if (stats.created + stats.updated < 3) {
                    console.log(`[DEBUG] Row platNomor: ${normalizedPlat}`);
                    console.log(`[DEBUG] All date columns in row:`, Object.keys(row).filter(k => k.toLowerCase().includes('tanggal') || k.toLowerCase().includes('terbit')));
                    console.log(`[DEBUG] tglTerbitRaw value: "${tglTerbitRaw}" (type: ${typeof tglTerbitRaw})`);
                    const parsedDate = parseExcelDate(tglTerbitRaw);
                    console.log(`[DEBUG] parsedDate: ${parsedDate}`);
                }

                // Match Kelurahan
                let kelurahanId = null;
                if (kelurahanName && kelurahanMap.has(kelurahanName.toString().toLowerCase().trim())) {
                    kelurahanId = kelurahanMap.get(kelurahanName.toString().toLowerCase().trim());
                }

                const parsedTanggalTerbitIzin = parseExcelDate(tglTerbitRaw);
                const parsedTanggalSkLps = parseExcelDate(row["Tanggal Sk LPS"]);

                const dataToSave: any = {
                    namaLps: namaLps,
                    platNomor: normalizedPlat,
                    isActive: true,
                };

                // Only include fields that have values (to avoid overwriting with null)
                if (row["Nomor izin"]) dataToSave.noIzinOperasi = row["Nomor izin"].toString();
                if (row["Nomor SK LPS"]) dataToSave.nomorSkLps = row["Nomor SK LPS"].toString();
                if (parsedTanggalSkLps) dataToSave.tanggalSkLps = parsedTanggalSkLps;
                if (row["Nama Ketua LPS"]) dataToSave.namaKetuaLps = row["Nama Ketua LPS"];
                if (row["Alamat LPS"]) dataToSave.alamatLps = row["Alamat LPS"];
                if (row["Wilayah Kerja"]) dataToSave.wilayahKerja = row["Wilayah Kerja"];
                if (row["Lokasi TPS Wilayah"]) dataToSave.lokasiTransdepo = row["Lokasi TPS Wilayah"];
                if (row["Jenis Armada"]) dataToSave.jenisArmada = row["Jenis Armada"].toUpperCase();
                if (parsedTanggalTerbitIzin) dataToSave.tanggalTerbitIzin = parsedTanggalTerbitIzin;
                if (namaSupir) dataToSave.namaSupir = namaSupir;
                if (kelurahanId) dataToSave.kelurahanId = kelurahanId;

                // Upsert
                const existing = await prisma.armada.findUnique({
                    where: { platNomor: normalizedPlat }
                });

                if (existing) {
                    // Don't overwrite qrCode on update
                    await prisma.armada.update({
                        where: { id: existing.id },
                        data: dataToSave
                    });
                    stats.updated++;
                } else {
                    // For new records, add qrCode
                    dataToSave.qrCode = normalizedPlat.replace(/\s/g, '');
                    await prisma.armada.create({
                        data: dataToSave
                    });
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
