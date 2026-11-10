import { prisma } from '@/lib/prisma';

export interface SyncResult {
  success: boolean;
  message: string;
  data?: any;
}

export const TIMBANGQR_AIRHITAM_URL =
  process.env.TIMBANGQR_AIRHITAM_URL?.trim() || 'https://airhitam-177-202-246-42.sslip.io';
export const TIMBANGQR_HARAPANJAYA_URL =
  process.env.TIMBANGQR_HARAPANJAYA_URL?.trim() || 'https://ocr-177-202-246-42.sslip.io';
const DEFAULT_SECRET = 'a8f9c4e2b7d013589ef671234abcd567890ef123456789abcdef0123456789ab';

function getSecret(): string {
  return (
    process.env.TIMBANGQR_INTEGRATION_SECRET?.trim() ||
    process.env.LPS_INTEGRATION_SECRET?.trim() ||
    DEFAULT_SECRET
  );
}

export function isHarapanJaya(lokasiTransdepo?: string | null, wilayahKerja?: string | null): boolean {
  const lokasiClean = (lokasiTransdepo || '').toUpperCase().replace(/[^A-Z]/g, '');
  const wilayahClean = (wilayahKerja || '').toUpperCase().replace(/[^A-Z]/g, '');
  return lokasiClean.includes('HARAPANJAYA') || wilayahClean.includes('HARAPANJAYA');
}

export function isAirHitamOrPalas(lokasiTransdepo?: string | null, wilayahKerja?: string | null): boolean {
  const lokasiClean = (lokasiTransdepo || '').toUpperCase().replace(/[^A-Z]/g, '');
  const wilayahClean = (wilayahKerja || '').toUpperCase().replace(/[^A-Z]/g, '');
  return (
    lokasiClean.includes('AIRHITAM') ||
    lokasiClean.includes('PALAS') ||
    wilayahClean.includes('AIRHITAM') ||
    wilayahClean.includes('PALAS')
  );
}

/**
 * Menentukan target server TimbangQR berdasarkan wilayah transdepo armada
 */
export function getTargetTimbangQrUrls(
  lokasiTransdepo?: string | null,
  wilayahKerja?: string | null
): Array<{ name: string; url: string }> {
  const isAH = isAirHitamOrPalas(lokasiTransdepo, wilayahKerja);
  const isHJ = isHarapanJaya(lokasiTransdepo, wilayahKerja);

  const targets: Array<{ name: string; url: string }> = [];

  if (isAH) {
    targets.push({ name: 'Air Hitam', url: TIMBANGQR_AIRHITAM_URL });
  }
  if (isHJ) {
    targets.push({ name: 'Harapan Jaya', url: TIMBANGQR_HARAPANJAYA_URL });
  }

  // Jika belum ditentukan atau null, kirim ke kedua server agar tidak ada yang terlewat
  if (targets.length === 0) {
    targets.push(
      { name: 'Air Hitam', url: TIMBANGQR_AIRHITAM_URL },
      { name: 'Harapan Jaya', url: TIMBANGQR_HARAPANJAYA_URL }
    );
  }

  return targets;
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
    isActive: armada.isActive !== undefined ? armada.isActive : true,
    kelurahan: armada.kelurahan ? {
      nama: armada.kelurahan.nama,
      kecamatan: armada.kelurahan.kecamatan ? { nama: armada.kelurahan.kecamatan.nama } : null,
    } : null,
  };
}

/**
 * Sinkronisasi data armada tunggal ke TimbangQR sesuai wilayah transdepo.
 * Dipanggil secara otomatis ketika data armada disimpan/diperbarui di Dashboard LPS.
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
    const targets = getTargetTimbangQrUrls(armada.lokasiTransdepo, armada.wilayahKerja);
    const secret = getSecret();

    const results = [];
    let anySuccess = false;

    for (const target of targets) {
      try {
        const targetEndpoint = `${target.url}/api/integrations/lps/armada-sync`;
        const response = await fetch(targetEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${secret}`,
            'x-integration-secret': secret,
          },
          body: JSON.stringify({ armada: payload }),
          signal: AbortSignal.timeout(12000),
        });

        if (response.ok) {
          const data = await response.json();
          anySuccess = true;
          results.push({ target: target.name, success: true, data });
        } else {
          const errorText = await response.text().catch(() => '');
          console.warn(`[Sync ${target.name} HTTP ${response.status}]:`, errorText);
          results.push({ target: target.name, success: false, status: response.status, error: errorText });
        }
      } catch (err: any) {
        console.error(`[Sync ${target.name} Exception]:`, err);
        results.push({ target: target.name, success: false, error: err.message });
      }
    }

    const targetNames = targets.map((t) => t.name).join(' & ');
    if (anySuccess) {
      return {
        success: true,
        message: `Armada ${armada.platNomor} berhasil disinkronkan ke Transdepo ${targetNames}.`,
        data: results,
      };
    } else {
      return {
        success: false,
        message: `Gagal menyinkronkan armada ${armada.platNomor} ke Transdepo ${targetNames}.`,
        data: results,
      };
    }
  } catch (error: any) {
    console.error('[syncArmadaToTimbangQr Exception]:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal menghubungi server TimbangQR.',
    };
  }
}

/**
 * Sinkronisasi seluruh armada ke TimbangQR sesuai wilayah transdepo masing-masing secara batch.
 */
export async function syncAllToTimbangQr(): Promise<SyncResult> {
  try {
    const armadas = await prisma.armada.findMany({
      include: {
        kelurahan: {
          include: { kecamatan: true },
        },
      },
    });

    if (!armadas.length) {
      return { success: true, message: 'Tidak ada armada untuk disinkronkan.', data: [] };
    }

    const secret = getSecret();

    // Pisahkan armada berdasarkan wilayah transdepo
    const airHitamPayloads: any[] = [];
    const harapanJayaPayloads: any[] = [];

    for (const a of armadas) {
      const payload = formatArmadaPayload(a);
      const targets = getTargetTimbangQrUrls(a.lokasiTransdepo, a.wilayahKerja);
      for (const t of targets) {
        if (t.name === 'Air Hitam') airHitamPayloads.push(payload);
        if (t.name === 'Harapan Jaya') harapanJayaPayloads.push(payload);
      }
    }

    const syncBatch = async (targetUrl: string, payloads: any[], targetName: string) => {
      if (!payloads.length) return { target: targetName, count: 0, synced: 0, total: 0 };
      let successCount = 0;
      const chunkSize = 25;
      for (let i = 0; i < payloads.length; i += chunkSize) {
        const chunk = payloads.slice(i, i + chunkSize);
        try {
          const res = await fetch(`${targetUrl}/api/integrations/lps/armada-sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${secret}`,
              'x-integration-secret': secret,
            },
            body: JSON.stringify({ armadas: chunk }),
            signal: AbortSignal.timeout(35000),
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.results)) {
              successCount += data.results.length;
            } else if (data.syncedCount) {
              successCount += data.syncedCount;
            }
          } else {
            const errText = await res.text().catch(() => '');
            console.warn(`[Batch ${targetName} HTTP ${res.status}]:`, errText);
          }
        } catch (e) {
          console.warn(`[Batch Sync ${targetName} Error]:`, e);
        }
      }
      return { target: targetName, total: payloads.length, synced: successCount };
    };

    const [resAirHitam, resHarapanJaya] = await Promise.all([
      syncBatch(TIMBANGQR_AIRHITAM_URL, airHitamPayloads, 'Air Hitam'),
      syncBatch(TIMBANGQR_HARAPANJAYA_URL, harapanJayaPayloads, 'Harapan Jaya'),
    ]);

    return {
      success: true,
      message: `Sinkronisasi selesai: Air Hitam (${resAirHitam.synced}/${resAirHitam.total}), Harapan Jaya (${resHarapanJaya.synced}/${resHarapanJaya.total}).`,
      data: { airHitam: resAirHitam, harapanJaya: resHarapanJaya },
    };
  } catch (error: any) {
    console.error('[syncAllToTimbangQr Exception]:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal menghubungi server TimbangQR.',
    };
  }
}

// Alias untuk backwards compatibility
export const syncAllHarapanJayaToTimbangQr = syncAllToTimbangQr;
