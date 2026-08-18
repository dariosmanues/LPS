import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

type TimbangQrPayload = {
  ticketNumber: string;
  plateNumber: string;
  lpsName: string;
  transdepo: string;
  weighedAt: string;
  grossKg: number;
  tareKg: number;
  rafaksiKg?: number;
  nettoKg: number;
  driverName?: string;
  vehicleType?: string;
  wasteType?: string;
  indicatorRaw?: string;
};

function authorized(request: NextRequest) {
  const secret = process.env.TIMBANGQR_INTEGRATION_SECRET;
  const received = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (!secret || !received) return false;
  const left = Buffer.from(received);
  const right = Buffer.from(secret);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function numberValue(value: unknown, field: string) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${field} tidak valid.`);
  return parsed;
}

function textValue(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} wajib diisi.`);
  return value.trim();
}

function normalizePlate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function normalizeTransdepo(value: string) {
  const normalized = value.toUpperCase().replace(/[^A-Z]/g, '');
  if (normalized === 'HARAPANJAYA' || normalized === 'HJ') return 'HARAPAN_JAYA';
  if (normalized === 'AIRHITAM' || normalized === 'AH') return 'AIR_HITAM';
  throw new Error('Transdepo harus HARAPAN_JAYA atau AIR_HITAM.');
}

function parsePayload(body: unknown): TimbangQrPayload {
  if (!body || typeof body !== 'object') throw new Error('Payload tidak valid.');
  const value = body as Record<string, unknown>;
  const grossKg = numberValue(value.grossKg, 'grossKg');
  const tareKg = numberValue(value.tareKg, 'tareKg');
  const rafaksiKg = numberValue(value.rafaksiKg ?? 0, 'rafaksiKg');
  const nettoKg = numberValue(value.nettoKg, 'nettoKg');
  if (grossKg <= tareKg || nettoKg <= 0) throw new Error('Nilai timbang tidak konsisten.');
  const weighedAt = textValue(value.weighedAt, 'weighedAt');
  if (Number.isNaN(Date.parse(weighedAt))) throw new Error('weighedAt tidak valid.');
  return {
    ticketNumber: textValue(value.ticketNumber, 'ticketNumber'),
    plateNumber: textValue(value.plateNumber, 'plateNumber'),
    lpsName: textValue(value.lpsName, 'lpsName'),
    transdepo: normalizeTransdepo(textValue(value.transdepo, 'transdepo')),
    weighedAt,
    grossKg,
    tareKg,
    rafaksiKg,
    nettoKg,
    driverName: typeof value.driverName === 'string' ? value.driverName.trim() : undefined,
    vehicleType: typeof value.vehicleType === 'string' ? value.vehicleType.trim() : undefined,
    wasteType: typeof value.wasteType === 'string' ? value.wasteType.trim() : undefined,
    indicatorRaw: typeof value.indicatorRaw === 'string' ? value.indicatorRaw.slice(0, 2000) : undefined,
  };
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const input = parsePayload(await request.json());
    const existing = await prisma.timbangQrSync.findUnique({
      where: { ticketNumber: input.ticketNumber },
      select: { id: true, wasteLogId: true },
    });
    if (existing) {
      return NextResponse.json({ ok: true, duplicate: true, syncId: existing.id, wasteLogId: existing.wasteLogId });
    }

    const armadas = await prisma.armada.findMany({
      where: { isActive: true },
      select: { id: true, platNomor: true, kelurahanId: true },
    });
    const armada = armadas.find((item) => normalizePlate(item.platNomor) === normalizePlate(input.plateNumber));
    if (!armada) {
      return NextResponse.json({
        error: `Armada dengan plat ${input.plateNumber} belum terdaftar atau tidak aktif di LPS.`,
      }, { status: 422 });
    }

    const saved = await prisma.$transaction(async (tx) => {
      const duplicate = await tx.timbangQrSync.findUnique({ where: { ticketNumber: input.ticketNumber } });
      if (duplicate) return { duplicate: true, syncId: duplicate.id, wasteLogId: duplicate.wasteLogId };

      const integrationUser = await tx.user.upsert({
        where: { email: 'integration@timbangqr.local' },
        update: { transdepo: input.transdepo, name: 'Integrasi TimbangQR' },
        create: {
          email: 'integration@timbangqr.local',
          passwordHash: 'INTEGRATION_ONLY_NO_LOGIN',
          name: 'Integrasi TimbangQR',
          role: 'SYSTEM_INTEGRATION',
          transdepo: input.transdepo,
        },
        select: { id: true },
      });

      const metadata = JSON.stringify({
        source: 'TimbangQR',
        ticketNumber: input.ticketNumber,
        grossKg: input.grossKg,
        tareKg: input.tareKg,
        rafaksiKg: input.rafaksiKg,
        driverName: input.driverName || null,
        vehicleType: input.vehicleType || null,
        wasteType: input.wasteType || null,
        indicatorRaw: input.indicatorRaw || null,
      });

      const wasteLog = await tx.wasteLog.create({
        data: {
          armadaId: armada.id,
          kelurahanId: armada.kelurahanId,
          recordedBy: integrationUser.id,
          beratKg: input.nettoKg,
          status: 'MASUK',
          recordedAt: new Date(input.weighedAt),
          metadata,
        },
        select: { id: true },
      });

      const sync = await tx.timbangQrSync.create({
        data: {
          ticketNumber: input.ticketNumber,
          plateNumber: input.plateNumber,
          lpsName: input.lpsName,
          transdepo: input.transdepo,
          grossKg: input.grossKg,
          tareKg: input.tareKg,
          rafaksiKg: input.rafaksiKg,
          nettoKg: input.nettoKg,
          weighedAt: new Date(input.weighedAt),
          wasteLogId: wasteLog.id,
          payload: JSON.stringify(input),
        },
        select: { id: true },
      });
      return { duplicate: false, syncId: sync.id, wasteLogId: wasteLog.id };
    });

    return NextResponse.json({ ok: true, ...saved }, { status: saved.duplicate ? 200 : 201 });
  } catch (error) {
    console.error('[TimbangQR Integration]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Gagal menerima transaksi.' }, { status: 400 });
  }
}
