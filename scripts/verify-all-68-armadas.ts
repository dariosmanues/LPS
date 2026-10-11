import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_URL || process.env.DATABASE_URL
        }
    }
});

async function main() {
    const pdfItems = JSON.parse(fs.readFileSync('d:/project/LPS/lps-app/data/master_armada_harapan_jaya_okt2026.json', 'utf8'));
    const allKelurahans = await prisma.kelurahan.findMany({
        include: { kecamatan: true }
    });
    const allDbArmada = await prisma.armada.findMany({
        include: {
            kelurahan: {
                include: { kecamatan: true }
            }
        }
    });

    console.log('=== FULL FIELD COMPARISON FOR 68 ARMADA ===');

    let totalDiscrepancies = 0;

    for (const item of pdfItems) {
        const cleanPlate = item.nomor_polisi.replace(/\s+/g, '').toUpperCase();
        
        // Find expected Kelurahan
        const expKelName = item.kelurahan_lps.trim().toUpperCase();
        const expectedKel = allKelurahans.find(k => 
            k.nama.toUpperCase() === expKelName ||
            k.nama.replace(/\s+/g, '').toUpperCase() === expKelName.replace(/\s+/g, '') ||
            (expKelName === 'SUKAMULIA' && k.nama.toUpperCase() === 'SUKAMULYA') ||
            (expKelName === 'PEMATANG KAPAU' && k.nama.toUpperCase() === 'PEMATANGKAPAU') ||
            (expKelName === 'SIALANG RAMPAI' && k.nama.toUpperCase() === 'SIALANGRAMPAI')
        );

        // Find db armada matching plate AND kelurahan if multiple
        const matchingArmadas = allDbArmada.filter(a => 
            a.platNomor.replace(/\s+/g, '').toUpperCase() === cleanPlate
        );

        let db = matchingArmadas.find(a => a.kelurahanId === expectedKel?.id);
        if (!db && matchingArmadas.length === 1) {
            db = matchingArmadas[0];
        }

        if (!db) {
            console.log(`[MISSING] #${item.no} ${item.nomor_polisi} (Kelurahan: ${item.kelurahan_lps}, LPS: ${item.nama_lps})`);
            totalDiscrepancies++;
            continue;
        }

        const diffs: string[] = [];
        if (db.kelurahanId !== expectedKel?.id) {
            diffs.push(`Kelurahan: DB=${db.kelurahan?.nama} vs PDF=${item.kelurahan_lps}`);
        }
        if (db.namaLps.trim().toLowerCase() !== item.nama_lps.trim().toLowerCase()) {
            diffs.push(`namaLps: DB="${db.namaLps}" vs PDF="${item.nama_lps}"`);
        }
        if (item.nama_ketua_lps && (!db.namaKetuaLps || !db.namaKetuaLps.toLowerCase().includes(item.nama_ketua_lps.trim().toLowerCase()))) {
            diffs.push(`namaKetuaLps: DB="${db.namaKetuaLps}" vs PDF="${item.nama_ketua_lps}"`);
        }
        if (item.jenis_armada && db.jenisArmada?.toUpperCase() !== item.jenis_armada.trim().toUpperCase()) {
            diffs.push(`jenisArmada: DB="${db.jenisArmada}" vs PDF="${item.jenis_armada}"`);
        }
        if (db.lokasiTransdepo !== 'HARAPANJAYA') {
            diffs.push(`lokasiTransdepo: DB="${db.lokasiTransdepo}" vs PDF="${item.lokasi_tps}"`);
        }
        if (item.nomor_izin && db.noIzinOperasi !== item.nomor_izin) {
            diffs.push(`noIzinOperasi: DB="${db.noIzinOperasi}" vs PDF="${item.nomor_izin}"`);
        }
        if (item.nomor_sk_lps && db.nomorSkLps !== item.nomor_sk_lps) {
            diffs.push(`nomorSkLps: DB="${db.nomorSkLps}" vs PDF="${item.nomor_sk_lps}"`);
        }

        if (diffs.length > 0) {
            console.log(`[DIFF] #${item.no} ${item.nomor_polisi} [${item.nama_lps}]: ${diffs.join('; ')}`);
            totalDiscrepancies++;
        }
    }

    console.log(`\nTotal items with any differences: ${totalDiscrepancies} / ${pdfItems.length}`);
}

main().finally(() => prisma.$disconnect());
