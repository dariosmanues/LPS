import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('=== AUDITING ALL 83 KELURAHAN ===\n');

    const kelurahans = await prisma.kelurahan.findMany({
        include: {
            kecamatan: true,
            users: true,
            armada: true
        },
        orderBy: [
            { kecamatan: { nama: 'asc' } },
            { nama: 'asc' }
        ]
    });

    console.log(`Total Kelurahan: ${kelurahans.length}`);

    let totalPassed = 0;
    const issues: { kelurahan: string; kecamatan: string; problem: string }[] = [];
    const report: any[] = [];

    for (let i = 0; i < kelurahans.length; i++) {
        const k = kelurahans[i];
        const index = i + 1;
        const baseSlug = k.nama.toLowerCase().replace(/\s+/g, '');
        const kebabSlug = k.nama.toLowerCase().replace(/\s+/g, '-');

        const ketua = k.users.filter(u => u.role === 'LPS_KETUA');
        const sekretaris = k.users.filter(u => u.role === 'LPS_SEKRETARIS');
        const bendahara = k.users.filter(u => u.role === 'LPS_BENDAHARA');

        let hasError = false;
        const kelurahanIssues: string[] = [];

        // Check Ketua
        if (ketua.length === 0) {
            hasError = true;
            kelurahanIssues.push('Missing LPS_KETUA user');
        } else {
            for (const u of ketua) {
                const match = await bcrypt.compare('lps123', u.passwordHash);
                if (!match) {
                    hasError = true;
                    kelurahanIssues.push(`LPS_KETUA (${u.email}) password does not match 'lps123'`);
                }
                if (u.kelurahanId !== k.id) {
                    hasError = true;
                    kelurahanIssues.push(`LPS_KETUA (${u.email}) kelurahanId mismatch`);
                }
            }
        }

        // Check Sekretaris
        if (sekretaris.length === 0) {
            hasError = true;
            kelurahanIssues.push('Missing LPS_SEKRETARIS user');
        } else {
            for (const u of sekretaris) {
                const match = await bcrypt.compare('lps123', u.passwordHash);
                if (!match) {
                    hasError = true;
                    kelurahanIssues.push(`LPS_SEKRETARIS (${u.email}) password does not match 'lps123'`);
                }
                if (u.kelurahanId !== k.id) {
                    hasError = true;
                    kelurahanIssues.push(`LPS_SEKRETARIS (${u.email}) kelurahanId mismatch`);
                }
            }
        }

        // Check Bendahara
        if (bendahara.length === 0) {
            hasError = true;
            kelurahanIssues.push('Missing LPS_BENDAHARA user');
        } else {
            for (const u of bendahara) {
                const match = await bcrypt.compare('lps123', u.passwordHash);
                if (!match) {
                    hasError = true;
                    kelurahanIssues.push(`LPS_BENDAHARA (${u.email}) password does not match 'lps123'`);
                }
                if (u.kelurahanId !== k.id) {
                    hasError = true;
                    kelurahanIssues.push(`LPS_BENDAHARA (${u.email}) kelurahanId mismatch`);
                }
            }
        }

        // Check standard email presence (ketua.<slug>@lps.pekanbaru.go.id)
        const expectedKetuaEmail = `ketua.${baseSlug}@lps.pekanbaru.go.id`;
        const hasExpectedKetua = ketua.some(u => u.email === expectedKetuaEmail || u.email === `ketua.${kebabSlug}@lps.pekanbaru.go.id`);
        if (!hasExpectedKetua) {
            hasError = true;
            kelurahanIssues.push(`Standard ketua email (${expectedKetuaEmail}) not found among ketua users`);
        }

        if (hasError) {
            issues.push({
                kelurahan: k.nama,
                kecamatan: k.kecamatan?.nama || 'Unknown',
                problem: kelurahanIssues.join('; ')
            });
        } else {
            totalPassed++;
        }

        report.push({
            no: index,
            nama: k.nama,
            kecamatan: k.kecamatan?.nama,
            ketuaEmails: ketua.map(u => u.email).join(', '),
            armadaCount: k.armada.length,
            status: hasError ? '❌ ISSUES' : '✅ OK',
            issues: kelurahanIssues
        });
    }

    console.log(`Results: ${totalPassed} / ${kelurahans.length} Kelurahan Passed OK.`);
    if (issues.length > 0) {
        console.log(`\n❌ Found ${issues.length} Kelurahans with issues:`);
        issues.forEach(iss => console.log(`- [${iss.kecamatan}] ${iss.kelurahan}: ${iss.problem}`));
    } else {
        console.log('\n🎉 ALL 83 KELURAHANS PASSED WITH FULL WORKING CREDENTIALS AND ACCESS!');
    }

    // Also check unlinked armadas across entire database
    const unlinkedArmadas = await prisma.armada.findMany({
        where: { kelurahanId: null }
    });
    console.log(`\nUnlinked Armadas (kelurahanId is null): ${unlinkedArmadas.length}`);
    if (unlinkedArmadas.length > 0) {
        unlinkedArmadas.forEach(a => console.log(`- ${a.platNomor}: ${a.namaLps} (wilayah: ${a.wilayahKerja})`));
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
