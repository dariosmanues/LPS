import crypto from 'node:crypto';
import QRCode from 'qrcode';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, x-timbangqr-key',
    'Access-Control-Max-Age': '86400',
};

export function handleOptions() {
    return new NextResponse(null, {
        status: 204,
        headers: corsHeaders,
    });
}

export function normalizePlate(plate: string): string {
    return (plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function generateArmadaQrCodeString(platNomor: string): string {
    const clean = normalizePlate(platNomor);
    // Unique 17-digit version: every regeneration creates a fresh QR payload.
    return `LPS-${clean}-${Date.now()}${crypto.randomInt(0, 10000).toString().padStart(4, '0')}`;
}

// SVG dibuat dari matriks QR murni tanpa react-dom/server, karena
// Next.js 16 melarang react-dom/server di dalam App Route handlers.
export function generateQrSvg(value: string, size = 256): string {
    const qr = QRCode.create(value, { errorCorrectionLevel: 'H' });
    const modules = qr.modules;
    const quietZone = 2;
    const viewSize = modules.size + quietZone * 2;
    const safeSize = Math.max(64, Math.min(1024, Math.floor(size) || 256));
    const shapes: string[] = [];
    for (let row = 0; row < modules.size; row++) {
        for (let col = 0; col < modules.size; col++) {
            if (modules.get(row, col)) {
                shapes.push(`M${col + quietZone} ${row + quietZone}h1v1h-1z`);
            }
        }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${safeSize}" height="${safeSize}" viewBox="0 0 ${viewSize} ${viewSize}" shape-rendering="crispEdges"><path fill="#fff" d="M0 0h${viewSize}v${viewSize}H0z"/><path fill="#000" d="${shapes.join('')}"/></svg>`;
}

export function generateQrDataUrl(value: string, size = 256): string {
    const svg = generateQrSvg(value, size);
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export function isTimbangQrAuthorized(request: NextRequest): boolean {
    const secret = process.env.TIMBANGQR_INTEGRATION_SECRET || process.env.LPS_INTEGRATION_SECRET;
    if (!secret) return false; // API integrations must fail closed without a shared secret

    const authHeader = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() || '';
    const apiKeyHeader = request.headers.get('x-api-key')?.trim() || request.headers.get('x-timbangqr-key')?.trim() || '';
    const queryToken = request.nextUrl.searchParams.get('secret')?.trim() || request.nextUrl.searchParams.get('apiKey')?.trim() || '';

    const candidate = authHeader || apiKeyHeader || queryToken;
    if (!candidate) return false;

    try {
        const left = Buffer.from(candidate);
        const right = Buffer.from(secret);
        return left.length === right.length && crypto.timingSafeEqual(left, right);
    } catch {
        return false;
    }
}

export function formatArmadaForTimbangQr(
    armada: {
        id: string;
        platNomor: string;
        namaLps: string;
        namaSupir: string | null;
        jenisArmada: string | null;
        lokasiTransdepo: string | null;
        noIzinOperasi?: string | null;
        qrCode: string;
        isQrUsed?: boolean;
        qrUsedAt?: Date | null;
        lastTicketNumber?: string | null;
        isActive: boolean;
        isMultiLpsVerified?: boolean;
        verifiedAt?: Date | null;
        verifiedBy?: string | null;
        kelurahan?: {
            id?: string;
            nama: string;
            kecamatan?: { nama: string } | null;
        } | null;
    },
    baseUrl?: string
) {
    const qrCode = armada.qrCode || `LPS-${normalizePlate(armada.platNomor)}-${armada.id.slice(0, 8)}`;
    const host = baseUrl || process.env.NEXTAUTH_URL || 'https://lps-app-five.vercel.app';
    const qrUrl = `${host}/api/qr-generator?code=${encodeURIComponent(qrCode)}&format=svg`;

    return {
        id: armada.id,
        platNomor: armada.platNomor,
        normalizedPlate: normalizePlate(armada.platNomor),
        namaLps: armada.namaLps,
        namaSupir: armada.namaSupir || null,
        jenisArmada: armada.jenisArmada || null,
        lokasiTransdepo: armada.lokasiTransdepo || null,
        noIzinOperasi: armada.noIzinOperasi || null,
        qrCode,
        qrUrl,
        qrDataUrl: generateQrDataUrl(qrCode, 200),
        isActive: armada.isActive,
        isQrUsed: Boolean(armada.isQrUsed),
        qrUsedAt: armada.qrUsedAt || null,
        lastTicketNumber: armada.lastTicketNumber || null,
        isMultiLpsVerified: Boolean(armada.isMultiLpsVerified),
        verifiedAt: armada.verifiedAt || null,
        verifiedBy: armada.verifiedBy || null,
        kelurahan: armada.kelurahan ? {
            id: armada.kelurahan.id,
            nama: armada.kelurahan.nama,
            kecamatan: armada.kelurahan.kecamatan?.nama || null,
        } : null,
    };
}

export async function handleTimbangQrGet(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get('code') || searchParams.get('qrCode');
        const plate = searchParams.get('plate') || searchParams.get('platNomor');
        const kelurahanQuery = searchParams.get('kelurahan');
        const transdepoQuery = searchParams.get('transdepo');
        const search = searchParams.get('search');
        const format = searchParams.get('format') || 'json';
        // SVG public rendering is retained for the LPS QR UI; JSON armada
        // lookup and bulk listing are private server-to-server operations.
        if (format !== 'svg' && !isTimbangQrAuthorized(request)) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }
        const rawText = searchParams.get('text');
        const includeInactive = searchParams.get('includeInactive') === 'true';

        const origin = request.nextUrl.origin || 'https://lps-app-five.vercel.app';

        // 1. Direct SVG rendering for arbitrary text or specific QR code
        if (format === 'svg') {
            let qrTextToRender = rawText;

            if (!qrTextToRender && (code || plate)) {
                const target = await prisma.armada.findFirst({
                    where: {
                        ...(code ? { qrCode: code } : {}),
                        ...(plate ? { platNomor: { equals: plate, mode: 'insensitive' } } : {}),
                    },
                    select: { qrCode: true, platNomor: true },
                });

                if (target) {
                    qrTextToRender = target.qrCode;
                } else if (code) {
                    qrTextToRender = code;
                } else if (plate) {
                    qrTextToRender = `LPS-${normalizePlate(plate)}`;
                }
            }

            if (!qrTextToRender) {
                return new NextResponse('Parameter "code", "plate", atau "text" diperlukan untuk format svg.', {
                    status: 400,
                    headers: { 'Content-Type': 'text/plain', ...corsHeaders },
                });
            }

            const size = parseInt(searchParams.get('size') || '256', 10);
            const svgContent = generateQrSvg(qrTextToRender, isNaN(size) ? 256 : size);

            return new NextResponse(svgContent, {
                status: 200,
                headers: {
                    'Content-Type': 'image/svg+xml; charset=utf-8',
                    'Cache-Control': 'public, max-age=86400, immutable',
                    ...corsHeaders,
                },
            });
        }

        // 2. Lookup single armada by QR code or plate number
        if (code || plate) {
            let armada = null;

            if (code) {
                // Try exact match on qrCode
                armada = await prisma.armada.findFirst({
                    where: { qrCode: code },
                    include: {
                        kelurahan: {
                            include: { kecamatan: true },
                        },
                    },
                });
                // If not found with exact qrCode match, check if code is an older LPS QR token
                if (!armada) {
                    const lpsMatch = code.match(/^LPS-([A-Z0-9]+)-(\d+)$/i);
                    if (lpsMatch) {
                        const targetNorm = normalizePlate(lpsMatch[1]);
                        const allArmadasForMatch = await prisma.armada.findMany({
                            include: { kelurahan: { include: { kecamatan: true } } },
                        });
                        const existingArmada = allArmadasForMatch.find(
                            (a) => normalizePlate(a.platNomor) === targetNorm
                        );

                        if (existingArmada) {
                            const isRegenerated = existingArmada.qrCode !== code;
                            const msg = isRegenerated
                                ? `QR Code ini sudah usang / tidak berlaku karena QR Code armada ${existingArmada.platNomor} telah di-generate ulang di Dashboard LPS. Silakan gunakan/cetak QR Code terbaru.`
                                : `QR Code ini sudah hangus (sudah pernah digunakan untuk transaksi tiket #${existingArmada.lastTicketNumber || '...'}). Silakan Hubungi Ketua Atau Pengurus LPS Anda .`;

                            return NextResponse.json(
                                {
                                    success: false,
                                    valid: false,
                                    burned: true,
                                    message: msg,
                                    data: formatArmadaForTimbangQr(existingArmada, origin),
                                },
                                { status: 400, headers: corsHeaders }
                            );
                        }
                    }

                    const norm = normalizePlate(code);
                    const allArmadas = await prisma.armada.findMany({
                        include: {
                            kelurahan: {
                                include: { kecamatan: true },
                            },
                        },
                    });
                    armada = allArmadas.find(
                        (a) => normalizePlate(a.platNomor) === norm || normalizePlate(a.qrCode) === norm
                    ) || null;
                }
            } else if (plate) {
                const norm = normalizePlate(plate);
                const allArmadas = await prisma.armada.findMany({
                    include: {
                        kelurahan: {
                            include: { kecamatan: true },
                        },
                    },
                });
                const matches = allArmadas.filter((a) => normalizePlate(a.platNomor) === norm);
                armada = matches[0] || null;
            }

            if (!armada) {
                return NextResponse.json(
                    {
                        success: false,
                        valid: false,
                        message: `Armada tidak ditemukan untuk parameter yang diberikan.`,
                    },
                    { status: 404, headers: { ...corsHeaders, 'Cache-Control': 'private, no-store, max-age=0' } }
                );
            }

            // Cek apakah nomor polisi ini melayani > 1 LPS dan sudah diverifikasi operator
            const normCheck = normalizePlate(armada.platNomor);
            const plateSiblings = await prisma.armada.findMany({
                where: { isActive: true },
                select: { id: true, platNomor: true, isMultiLpsVerified: true, namaLps: true },
            });
            const matchesForPlate = plateSiblings.filter((a) => normalizePlate(a.platNomor) === normCheck);
            const isMultiLps = matchesForPlate.length > 1;
            const isMultiLpsVerified = matchesForPlate.some((a) => Boolean(a.isMultiLpsVerified));

            const formatted = formatArmadaForTimbangQr(armada, origin);
            if (isMultiLpsVerified) {
                formatted.isMultiLpsVerified = true;
            }

            // Check if QR code is already burned / used!
            // QR Code LPS yang diterbitkan dari qr-generator selalu hangus jika armada.isQrUsed = true
            const isLpsQrCode = Boolean(code && (/^LPS-/i.test(code) || code === armada.qrCode));
            const shouldBurn = armada.isQrUsed && (isLpsQrCode || !isMultiLpsVerified);
            if (shouldBurn) {
                return NextResponse.json(
                    {
                        success: false,
                        valid: false,
                        burned: true,
                        message: `QR Code ini sudah hangus (sudah pernah digunakan untuk transaksi tiket #${armada.lastTicketNumber || '...'}). Silakan Hubungi Ketua Atau Pengurus LPS Anda .`,
                        data: formatted,
                    },
                    { status: 400, headers: corsHeaders }
                );
            }

            return NextResponse.json(
                {
                    success: true,
                    valid: armada.isActive && !shouldBurn,
                    burned: Boolean(shouldBurn),
                    isMultiLps,
                    isMultiLpsVerified,
                    data: formatted,
                },
                { headers: { ...corsHeaders, 'Cache-Control': 'private, no-store, max-age=0' } }
            );
        }

        // 3. List and filter armadas with QR codes
        const whereClause: Record<string, any> = {};
        if (!includeInactive) {
            whereClause.isActive = true;
        }

        if (transdepoQuery) {
            whereClause.lokasiTransdepo = {
                contains: transdepoQuery.replace(/[^A-Za-z0-9]/g, ''),
                mode: 'insensitive',
            };
        }

        if (kelurahanQuery) {
            whereClause.kelurahan = {
                nama: {
                    contains: kelurahanQuery,
                    mode: 'insensitive',
                },
            };
        }

        const armadas = await prisma.armada.findMany({
            where: whereClause,
            include: {
                kelurahan: {
                    include: { kecamatan: true },
                },
            },
            orderBy: { platNomor: 'asc' },
        });

        let filtered = armadas;
        if (search) {
            const s = search.toLowerCase();
            const sNorm = normalizePlate(search);
            filtered = armadas.filter((a) => {
                return (
                    a.platNomor.toLowerCase().includes(s) ||
                    normalizePlate(a.platNomor).includes(sNorm) ||
                    a.namaLps.toLowerCase().includes(s) ||
                    (a.namaSupir && a.namaSupir.toLowerCase().includes(s)) ||
                    (a.kelurahan && a.kelurahan.nama.toLowerCase().includes(s))
                );
            });
        }

        const formattedList = filtered.map((a) => formatArmadaForTimbangQr(a, origin));

        return NextResponse.json(
            {
                success: true,
                count: formattedList.length,
                total: armadas.length,
                data: formattedList,
            },
            { headers: corsHeaders }
        );
    } catch (error) {
        console.error('[TimbangQR QR-Generator API] GET error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
            },
            { status: 500, headers: corsHeaders }
        );
    }
}

export async function handleTimbangQrPost(request: NextRequest) {
    if (!isTimbangQrAuthorized(request)) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }
    try {
        const body = await request.json().catch(() => ({}));
        const { armadaId, platNomor, regenerate, text } = body;
        const origin = request.nextUrl.origin || 'https://lps-app-five.vercel.app';

        // 1. If arbitrary text is provided, just generate the QR SVG & Data URL without modifying database
        if (text && !armadaId && !platNomor) {
            const svg = generateQrSvg(text, 256);
            return NextResponse.json(
                {
                    success: true,
                    data: {
                        qrCode: text,
                        qrUrl: `${origin}/api/qr-generator?text=${encodeURIComponent(text)}&format=svg`,
                        qrSvg: svg,
                        qrDataUrl: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
                    },
                },
                { headers: corsHeaders }
            );
        }

        // 2. Find armada by id or platNomor
        let armada = null;
        if (armadaId) {
            armada = await prisma.armada.findUnique({
                where: { id: armadaId },
                include: {
                    kelurahan: { include: { kecamatan: true } },
                },
            });
        } else if (platNomor) {
            const norm = normalizePlate(platNomor);
            const all = await prisma.armada.findMany({
                include: {
                    kelurahan: { include: { kecamatan: true } },
                },
            });
            armada = all.find((a) => normalizePlate(a.platNomor) === norm) || null;
        }

        if (!armada) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Armada tidak ditemukan dengan armadaId atau platNomor yang diberikan.',
                },
                { status: 404, headers: corsHeaders }
            );
        }

        // 3. Generate or regenerate QR Code
        let targetQrCode = armada.qrCode;
        if (regenerate || !targetQrCode) {
            targetQrCode = generateArmadaQrCodeString(armada.platNomor);

            armada = await prisma.armada.update({
                where: { id: armada.id },
                data: { qrCode: targetQrCode },
                include: {
                    kelurahan: { include: { kecamatan: true } },
                },
            });
        }

        const formatted = formatArmadaForTimbangQr(armada, origin);

        return NextResponse.json(
            {
                success: true,
                message: regenerate ? 'QR Code berhasil di-regenerate.' : 'QR Code berhasil diperoleh.',
                data: {
                    ...formatted,
                    qrSvg: generateQrSvg(formatted.qrCode, 256),
                },
            },
            { status: 200, headers: corsHeaders }
        );
    } catch (error) {
        console.error('[TimbangQR QR-Generator API] POST error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
            },
            { status: 500, headers: corsHeaders }
        );
    }
}
