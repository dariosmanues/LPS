const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const str = "AgrowisataAir DinginAir HitamAir PutihBambu KuningBandar RayaBinaragaBinawidyaCinta RajaDelimaHarjosariIndustri TenayanJadirejoKampung BandarKampung BaruKampung DalamKampung MelayuKampung TengahKedung SariKota BaruKota TinggiKulimLabuh Baru BaratLabuh Baru TimurLembah DamaiLimbunganLimbungan BaruMaharaniMaharatuMelebungMentangorMeranti PandakMuara Fajar BaratMuara Fajar TimurPadang BulanPadang TerubukPalasPebatuanPematangkapauPerhentian MarpoyanPesisirPulau KaramRantau PanjangRejosariRintisRumbai BukitRumbai SipatSagoSekipSialang MungguSialang RampaiSialang SaktiSidomulyo BaratSidomulyo TimurSimpang BaruSimpang EmpatSimpang TigaSri MerantiSukajadiSukamajuSukamulyaSukaramaiSumahilangSungai AmbangSungai SibamSungai UkaiTampanTanah DatarTangkerang BaratTangkerang LabuaiTangkerang SelatanTangkerang TengahTangkerang TimurTangkerang UtaraTirta SiakTobek GodangTuah KaryaTuah MadaniTuah NegeriUmban SariWonorejo";

const names = str.split(/(?<=[a-z])(?=[A-Z])/);

async function main() {
    console.log(`Found ${names.length} kelurahans.`);
    
    let count = 0;
    for (const name of names) {
        // Check if exists first to avoid duplicates if run multiple times
        const existing = await prisma.kelurahan.findFirst({
            where: { nama: name }
        });

        if (!existing) {
            await prisma.kelurahan.create({
                data: {
                    nama: name,
                    kecamatan: "Pekanbaru" 
                }
            });
            count++;
        }
    }
    
    console.log(`Successfully inserted ${count} new kelurahans!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
