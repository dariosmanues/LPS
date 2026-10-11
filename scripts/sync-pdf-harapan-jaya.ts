import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_URL || process.env.DATABASE_URL
        }
    }
});

// Indonesian month parsing
const MONTHS: Record<string, number> = {
    'januari': 0, 'jan': 0,
    'februari': 1, 'feb': 1,
    'maret': 2, 'mar': 2,
    'april': 3, 'apr': 3,
    'mei': 4,
    'juni': 5, 'jun': 5,
    'juli': 6, 'jul': 6,
    'agustus': 7, 'agu': 7, 'agt': 7,
    'september': 8, 'sep': 8,
    'oktober': 9, 'okt': 9,
    'november': 10, 'nov': 10,
    'desember': 11, 'des': 11,
};

function parseIndonesianDate(str?: string | null): Date | null {
    if (!str || str.trim() === '' || str.trim() === '-') return null;
    const s = str.trim().toLowerCase();

    // Check DD/MM/YYYY
    const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
        const day = parseInt(slashMatch[1], 10);
        const month = parseInt(slashMatch[2], 10) - 1;
        const year = parseInt(slashMatch[3], 10);
        return new Date(Date.UTC(year, month, day));
    }

    // Check DD Month YYYY
    const textMatch = s.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
    if (textMatch) {
        const day = parseInt(textMatch[1], 10);
        const monthName = textMatch[2];
        const year = parseInt(textMatch[3], 10);
        const month = MONTHS[monthName];
        if (month !== undefined) {
            return new Date(Date.UTC(year, month, day));
        }
    }

    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
}

function normalizeJenis(jenis?: string | null): string {
    if (!jenis) return 'PICKUP';
    const up = jenis.toUpperCase().trim();
    if (up.includes('DUMP') || up.includes('TRUCK')) return 'DUMPTRUCK';
    if (up.includes('BENTOR') || up.includes('MOTOR')) return 'BENTOR';
    return 'PICKUP';
}

async function main() {
    console.log('=== SYNC DATA ARMADA SESUAI PDF HARAPAN JAYA OKTOBER 2026 ===\n');

    const pdfItems = JSON.parse(
        fs.readFileSync('d:/project/LPS/lps-app/data/master_armada_harapan_jaya_okt2026.json', 'utf8')
    );
    console.log(`Loaded ${pdfItems.length} records from master JSON.\n`);

    const allKelurahans = await prisma.kelurahan.findMany({
        include: { kecamatan: true }
    });

    const kelurahanMap = new Map<string, string>();
    for (const k of allKelurahans) {
        kelurahanMap.set(k.nama.toUpperCase().trim(), k.id);
        kelurahanMap.set(k.nama.replace(/\s+/g, '').toUpperCase().trim(), k.id);
    }
    // Specific aliases
    kelurahanMap.set('PEMATANG KAPAU', kelurahanMap.get('PEMATANGKAPAU')!);
    kelurahanMap.set('SIALANG RAMPAI', kelurahanMap.get('SIALANGRAMPAI')!);
    kelurahanMap.set('SUKAMULIA', kelurahanMap.get('SUKAMULYA')!);

    console.log('1. Checking & updating/creating all 68 armadas...');

    for (const item of pdfItems) {
        const platNomor = item.nomor_polisi.trim().replace(/\s+/g, ' ');
        const kelName = item.kelurahan_lps.trim().toUpperCase();
        const kelurahanId = kelurahanMap.get(kelName);

        if (!kelurahanId) {
            console.error(`❌ Kelurahan not found for "${kelName}"`);
            continue;
        }

        const tglSk = parseIndonesianDate(item.tanggal_sk_lps);
        const tglIzin = parseIndonesianDate(item.tanggal_terbit_izin);
        const jenis = normalizeJenis(item.jenis_armada);
        const namaLps = (item.nama_lps || item.nama_lps_2 || '').trim();
        const namaKetua = (item.nama_ketua_lps || '').trim() || null;
        const alamat = (item.alamat_lps || '').trim() || null;
        const wilayah = (item.wilayah_kerja || '').trim() || null;
        const noIzin = (item.nomor_izin || '').trim() || null;
        const noSk = (item.nomor_sk_lps || '').trim() || null;

        // Special handling for BM 9601 TZ (appears for both Pesisir and Rintis)
        if (platNomor === 'BM 9601 TZ') {
            const existingForKelurahan = await prisma.armada.findFirst({
                where: {
                    platNomor: 'BM 9601 TZ',
                    kelurahanId: kelurahanId
                }
            });

            if (existingForKelurahan) {
                await prisma.armada.update({
                    where: { id: existingForKelurahan.id },
                    data: {
                        namaLps,
                        namaKetuaLps: namaKetua,
                        alamatLps: alamat,
                        wilayahKerja: wilayah,
                        noIzinOperasi: noIzin,
                        nomorSkLps: noSk,
                        tanggalSkLps: tglSk,
                        tanggalTerbitIzin: tglIzin,
                        lokasiTransdepo: 'HARAPANJAYA',
                        jenisArmada: jenis,
                        isActive: true
                    }
                });
                console.log(`  ✅ Updated BM 9601 TZ for ${kelName}`);
            } else {
                // Check if an unassigned or other BM 9601 TZ exists
                const anyExisting = await prisma.armada.findFirst({
                    where: { platNomor: 'BM 9601 TZ' }
                });

                if (anyExisting && (!anyExisting.kelurahanId || anyExisting.kelurahanId === kelurahanId)) {
                    await prisma.armada.update({
                        where: { id: anyExisting.id },
                        data: {
                            namaLps,
                            namaKetuaLps: namaKetua,
                            alamatLps: alamat,
                            wilayahKerja: wilayah,
                            noIzinOperasi: noIzin,
                            nomorSkLps: noSk,
                            tanggalSkLps: tglSk,
                            tanggalTerbitIzin: tglIzin,
                            lokasiTransdepo: 'HARAPANJAYA',
                            jenisArmada: jenis,
                            kelurahanId,
                            isActive: true
                        }
                    });
                    console.log(`  ✅ Assigned existing BM 9601 TZ to ${kelName}`);
                } else {
                    const cleanCode = `ARMADA-${platNomor.replace(/\s+/g, '')}-${kelName.slice(0, 4)}`;
                    await prisma.armada.create({
                        data: {
                            platNomor,
                            namaLps,
                            namaKetuaLps: namaKetua,
                            alamatLps: alamat,
                            wilayahKerja: wilayah,
                            noIzinOperasi: noIzin,
                            nomorSkLps: noSk,
                            tanggalSkLps: tglSk,
                            tanggalTerbitIzin: tglIzin,
                            lokasiTransdepo: 'HARAPANJAYA',
                            jenisArmada: jenis,
                            kelurahanId,
                            qrCode: cleanCode,
                            isActive: true
                        }
                    });
                    console.log(`  ✨ Created separate BM 9601 TZ for ${kelName}`);
                }
            }
            continue;
        }

        // For all other plates:
        const existing = await prisma.armada.findFirst({
            where: { platNomor: { equals: platNomor, mode: 'insensitive' } }
        });

        if (existing) {
            await prisma.armada.update({
                where: { id: existing.id },
                data: {
                    namaLps,
                    namaKetuaLps: namaKetua,
                    alamatLps: alamat,
                    wilayahKerja: wilayah,
                    noIzinOperasi: noIzin,
                    nomorSkLps: noSk,
                    tanggalSkLps: tglSk,
                    tanggalTerbitIzin: tglIzin,
                    lokasiTransdepo: 'HARAPANJAYA',
                    jenisArmada: jenis,
                    kelurahanId,
                    isActive: true
                }
            });
            console.log(`  ✅ #${item.no} Updated ${platNomor} -> Kelurahan: ${kelName} (LPS: ${namaLps})`);
        } else {
            const qrCode = `ARMADA-${platNomor.replace(/\s+/g, '')}`;
            await prisma.armada.create({
                data: {
                    platNomor,
                    namaLps,
                    namaKetuaLps: namaKetua,
                    alamatLps: alamat,
                    wilayahKerja: wilayah,
                    noIzinOperasi: noIzin,
                    nomorSkLps: noSk,
                    tanggalSkLps: tglSk,
                    tanggalTerbitIzin: tglIzin,
                    lokasiTransdepo: 'HARAPANJAYA',
                    jenisArmada: jenis,
                    kelurahanId,
                    qrCode,
                    isActive: true
                }
            });
            console.log(`  ✨ #${item.no} Created new ${platNomor} -> Kelurahan: ${kelName} (LPS: ${namaLps})`);
        }
    }

    console.log('\n2. Ensuring User accounts and aliases for all 26 Kelurahans...');
    const hashedPassword = await bcrypt.hash('lps123', 10);

    const uniqueKelNames: string[] = Array.from(new Set(pdfItems.map((x: any) => String(x.kelurahan_lps).trim())));

    for (const kelName of uniqueKelNames) {
        const kelId = kelurahanMap.get(kelName.toUpperCase());
        if (!kelId) continue;
        const kel = allKelurahans.find(k => k.id === kelId)!;

        // Primary base name (e.g. "sukamaju", "pematangkapau", "bambukuning")
        const primarySlug = kel.nama.toLowerCase().replace(/\s+/g, '');
        // PDF slug if different (e.g. "sukamulia" vs "sukamulya", "pematangkapau")
        const pdfSlug = kelName.toLowerCase().replace(/\s+/g, '');
        // Hyphenated slug (e.g. "pematang-kapau", "bambu-kuning", "sialang-rampai")
        const hyphenSlug = kelName.toLowerCase().replace(/\s+/g, '-');

        const slugs = Array.from(new Set([primarySlug, pdfSlug, hyphenSlug]));

        for (const slug of slugs) {
            const email = `ketua.${slug}@lps.pekanbaru.go.id`;
            await prisma.user.upsert({
                where: { email },
                update: {
                    kelurahanId: kel.id,
                    role: 'LPS_KETUA',
                    passwordHash: hashedPassword
                },
                create: {
                    email,
                    name: `Ketua LPS ${kel.nama}`,
                    role: 'LPS_KETUA',
                    passwordHash: hashedPassword,
                    kelurahanId: kel.id
                }
            });
        }
    }

    console.log('✅ User accounts and aliases created with password "lps123"');
    console.log('\n🎉 Selesai sinkronisasi!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
