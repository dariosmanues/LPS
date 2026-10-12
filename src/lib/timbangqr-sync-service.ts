import { prisma } from '@/lib/prisma';

export interface SyncResult {
  success: boolean;
  message: string;
  data?: any;
}

const DEFAULT_TIMBANGQR_URL = 'https://timbangqr-ocr-led.vercel.app';
const DEFAULT_SECRET = 'a8f9c4e2b7d013589ef671234abcd567890ef123456789abcdef0123456789ab';

function getTargetUrl(): string {
  return (
    process.env.TIMBANGQR_API_URL?.trim() ||
    process.env.TIMBANGQR_URL?.trim() ||
    DEFAULT_TIMBANGQR_URL
  ).replace(/\/$/, '');
}

function getSecret(): string {
  return (
    process.env.TIMBANGQR_INTEGRATION_SECRET?.trim() ||
    process.env.LPS_INTEGRATION_SECRET?.trim() ||
    DEFAULT_SECRET
  );
}

export function isHarapanJaya(lokasiTransdepo?: string | null, wilayahKerja?: string | null): boolean {
  const lokasiClean = (lokasiTransdepo || '').toUpperCase().replace(/\s+/g, '');
  const wilayahClean = (wilayahKerja || '').toUpperCase().replace(/\s+/g, '');
  return lokasiClean.includes('HARAPANJAYA') || wilayahClean.includes('HARAPANJAYA');
}

export function formatArmadaPayload(armada: any) {
  return {
    id: armada.id,
    platNomor: armada.platNomor,
    namaLps: armada.namaLps,
    namaSupir: armada.namaSupir || null,
    namaKetuaLps: armada.namaKetuaLps || null,
    noTlpKetuaLps: armada.noTlpKetuaLps || null,
    alamatLps: armada.alamatLps || null,
    wilayahKerja: armada.wilayahKerja || null,
    lokasiTransdepo: armada.lokasiTransdepo || null,
    jenisArmada: armada.jenisArmada || null,
    noIzinOperasi: armada.noIzinOperasi || null,
    nomorSkLps: armada.nomorSkLps || null,
    tanggalSkLps: armada.tanggalSkLps ? new Date(armada.tanggalSkLps).toISOString().split('T')[0] : null,
    tanggalTerbitIzin: armada.tanggalTerbitIzin ? new Date(armada.tanggalTerbitIzin).toISOString().split('T')[0] : null,
    qrCode: armada.qrCode,
    isActive: armada.isActive,
    kelurahan: armada.kelurahan ? {
      nama: armada.kelurahan.nama,
      kecamatan: armada.kelurahan.kecamatan ? { nama: armada.kelurahan.kecamatan.nama } : null,
    } : null,
  };
}

/**
 * Sinkronisasi data armada tunggal ke TimbangQR.
 * Dipanggil secara otomatis ketika data armada disimpan/diperbarui.
 */
export async function syncArmadaToTimbangQr(armadaIdOrObject: string | any): Promise<SyncResult> {
  try {
    let armada = typeof armadaIdOrObject === 'string' ? null : armadaIdOrObject;

    if (!armada || !armada.platNomor) {
      const id = typeof armadaIdOrObject === 'string' ? armadaIdOrObject : armadaIdOrObject?.id;
      if (!id) {
        return { success: false, message: 'ID armada tidak valid.' };
      }

      armada = await prisma.armada.findUnique({
        where: { id },
        include: {
          kelurahan: {
            include: { kecamatan: true },
          },
        },
      });

      if (!armada) {
        return { success: false, message: 'Armada tidak ditemukan di database LPS.' };
      }
    }

    const payload = formatArmadaPayload(armada);
    const targetUrl = `${getTargetUrl()}/api/integrations/lps/armada-sync`;
    const secret = getSecret();

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`,
        'x-integration-secret': secret,
      },
      body: JSON.stringify({ armada: payload }),
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.warn(`[TimbangQR Sync HTTP ${response.status}]:`, errorText);
      return {
        success: false,
        message: `Gagal sinkronisasi ke TimbangQR (HTTP ${response.status}).`,
        data: errorText,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: `Armada ${armada.platNomor} berhasil disinkronkan ke TimbangQR.`,
      data,
    };
  } catch (error: any) {
    console.error('[syncArmadaToTimbangQr Exception]:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal menghubungi server TimbangQR.',
    };
  }
}

/**
 * Sinkronisasi seluruh armada Harapan Jaya ke TimbangQR secara batch.
 */
export async function syncAllHarapanJayaToTimbangQr(): Promise<SyncResult> {
  try {
    const armadas = await prisma.armada.findMany({
      where: {
        OR: [
          { lokasiTransdepo: { contains: 'HARAPAN', mode: 'insensitive' } },
          { wilayahKerja: { contains: 'HARAPAN', mode: 'insensitive' } },
        ],
      },
      include: {
        kelurahan: {
          include: { kecamatan: true },
        },
      },
    });

    if (!armadas.length) {
      return { success: true, message: 'Tidak ada armada Harapan Jaya untuk disinkronkan.', data: [] };
    }

    const payloads = armadas.map((a) => formatArmadaPayload(a));
    const targetUrl = `${getTargetUrl()}/api/integrations/lps/armada-sync`;
    const secret = getSecret();

    const chunkSize = 10;
    const allResults = [];
    let successCount = 0;

    for (let i = 0; i < payloads.length; i += chunkSize) {
      const chunk = payloads.slice(i, i + chunkSize);
      try {
        const response = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${secret}`,
            'x-integration-secret': secret,
          },
          body: JSON.stringify({ armadas: chunk }),
          signal: AbortSignal.timeout(30000),
        });

        if (response.ok) {
          const chunkData = await response.json();
          if (Array.isArray(chunkData.results)) {
            allResults.push(...chunkData.results);
            successCount += chunkData.results.length;
          }
        } else {
          const errText = await response.text().catch(() => '');
          console.warn(`[Batch Sync Chunk ${Math.floor(i / chunkSize) + 1} Error]:`, errText);
        }
      } catch (chunkErr) {
        console.warn(`[Batch Sync Chunk ${Math.floor(i / chunkSize) + 1} Exception]:`, chunkErr);
      }
    }

    return {
      success: true,
      message: `Berhasil menyinkronkan ${successCount} dari ${armadas.length} armada Harapan Jaya ke TimbangQR.`,
      data: { total: armadas.length, synced: successCount, results: allResults },
    };
  } catch (error: any) {
    console.error('[syncAllHarapanJayaToTimbangQr Exception]:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal menghubungi server TimbangQR.',
    };
  }
}
