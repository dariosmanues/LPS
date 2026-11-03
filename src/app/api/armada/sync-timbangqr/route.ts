import { NextResponse } from 'next/server';
import { syncAllToTimbangQr, syncArmadaToTimbangQr } from '@/lib/timbangqr-sync-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        
        if (body.armadaId) {
            const result = await syncArmadaToTimbangQr(body.armadaId);
            return NextResponse.json(result, { status: result.success ? 200 : 502 });
        }

        const result = await syncAllToTimbangQr();
        return NextResponse.json(result, { status: result.success ? 200 : 502 });
    } catch (error: any) {
        console.error('[POST /api/armada/sync-timbangqr Error]:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Gagal sinkronisasi data ke TimbangQR'
        }, { status: 500 });
    }
}
