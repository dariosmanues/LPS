import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx'; // fixed import type
import * as path from 'path';
import * as fs from 'fs';

export async function GET() {
    try {
        const armadas = await prisma.armada.findMany({
            include: {
                kelurahan: {
                    include: {
                        kecamatan: true
                    }
                }
            }
        });

        const anomalies = {
            missingKelurahan: [] as any[],
            missingDriver: [] as any[],
            missingLicense: [] as any[],
            duplicatePlat: [] as any[],
            crossKelurahanPlates: [] as any[], // NEW
            excelDuplicates: [] as any[], // NEW: Show duplicates from Excel
        };

        const platMap = new Map<string, any[]>();

        // Pass 1: Scan for issues and collect plates
        for (const armada of armadas) {
            // Check Missing Kelurahan
            if (!armada.kelurahanId) {
                anomalies.missingKelurahan.push(armada);
            }

            // Check Missing Driver
            if (!armada.namaSupir || armada.namaSupir === '-' || armada.namaSupir.trim() === '') {
                anomalies.missingDriver.push(armada);
            }

            // Check Missing Izin
            if (!armada.noIzinOperasi || armada.noIzinOperasi === '-') {
                anomalies.missingLicense.push(armada);
            }

            // Check Duplicate Plat (Fuzzy: ignore spaces/case)
            if (armada.platNomor) {
                const normalized = armada.platNomor.replace(/\s+/g, '').toUpperCase();
                if (!platMap.has(normalized)) {
                    platMap.set(normalized, []);
                }
                platMap.get(normalized)?.push(armada);
            }
        }

        // Pass 2: Identify Fuzzy Duplicates & Cross-Kelurahan Issues
        platMap.forEach((duplicates, key) => {
            if (duplicates.length > 1) {
                // If we found more than 1 record with the same normalized plate
                anomalies.duplicatePlat.push(...duplicates);

                // Check if they belong to different kelurahan
                const kelurahanIds = new Set(duplicates.map(d => d.kelurahanId || 'NULL'));
                if (kelurahanIds.size > 1) {
                    // This is a cross-kelurahan issue!
                    anomalies.crossKelurahanPlates.push(...duplicates);
                }
            }
        });

        // Pass 3: Check Excel for historical duplicates
        try {
            console.log('[ANOMALY API] Starting Excel duplicate check...');
            const filePath = path.join(process.cwd(), 'REKAP ARMADA TAHUN 2026.xlsx');
            console.log('[ANOMALY API] File path:', filePath);

            // Use fs to read buffer first - safer for Next.js
            if (fs.existsSync(filePath)) {
                const fileBuffer = fs.readFileSync(filePath);
                const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
                console.log('[ANOMALY API] Workbook read successfully');

                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const excelData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
                console.log('[ANOMALY API] Parsed', excelData.length, 'rows from Excel');

                const excelPlatMap = new Map<string, any[]>();

                for (let i = 0; i < excelData.length; i++) {
                    const row = excelData[i];
                    let plat = row['Nomor Polisi'];

                    if (plat) {
                        const normalized = String(plat).replace(/\s+/g, '').toUpperCase();
                        if (!excelPlatMap.has(normalized)) {
                            excelPlatMap.set(normalized, []);
                        }
                        excelPlatMap.get(normalized)?.push({
                            rowNum: i + 2,
                            platOriginal: plat,
                            lpsName: row['Nama Ketua LPS'] || row['LPS'] || 'Tidak ada info LPS'
                        });
                    }
                }

                // Find duplicates in Excel
                excelPlatMap.forEach((records, normalizedPlate) => {
                    if (records.length > 1) {
                        anomalies.excelDuplicates.push({
                            plate: normalizedPlate,
                            count: records.length,
                            occurrences: records
                        });
                    }
                });


                console.log('[ANOMALY API] Found', anomalies.excelDuplicates.length, 'Excel duplicates');
            } else {
                console.log('[ANOMALY API] File not found REKAP ARMADA TAHUN 2026.xlsx');
            }
        } catch (error) {
            console.error('[ANOMALY API] Error reading Excel file:', error);
            // Continue without Excel data
        }

        return NextResponse.json({
            summary: {
                totalArmada: armadas.length,
                missingKelurahan: anomalies.missingKelurahan.length,
                missingDriver: anomalies.missingDriver.length,
                missingLicense: anomalies.missingLicense.length,
                duplicatePlat: anomalies.duplicatePlat.length,
                crossKelurahanPlates: anomalies.crossKelurahanPlates.length, // NEW
                excelDuplicates: anomalies.excelDuplicates.length, // NEW
            },
            details: anomalies
        });

    } catch (error) {
        console.error('Error checking anomalies:', error);
        return NextResponse.json({ error: 'Failed to check anomalies' }, { status: 500 });
    }
}
