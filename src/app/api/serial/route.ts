import { NextRequest, NextResponse } from 'next/server';
import {
    connectSerial,
    disconnectSerial,
    sendSerial,
    getSerialStatus,
    consumeLastData,
    consumeBuffer,
    listSerialPorts,
} from '@/lib/serial';

/**
 * GET /api/serial
 * Query params:
 *   action = status | data | consume | buffer | ports
 */
export async function GET(request: NextRequest) {
    const action = request.nextUrl.searchParams.get('action') || 'status';

    try {
        switch (action) {
            case 'status': {
                const status = getSerialStatus();
                return NextResponse.json({ success: true, ...status });
            }

            case 'data': {
                // Get latest data without consuming it
                const status = getSerialStatus();
                return NextResponse.json({
                    success: true,
                    data: status.lastData,
                    isConnected: status.isConnected,
                });
            }

            case 'consume': {
                // Get and clear the latest data
                const data = consumeLastData();
                return NextResponse.json({
                    success: true,
                    data,
                    isConnected: getSerialStatus().isConnected,
                });
            }

            case 'buffer': {
                // Get and clear all buffered data
                const buffer = consumeBuffer();
                return NextResponse.json({
                    success: true,
                    data: buffer,
                    count: buffer.length,
                    isConnected: getSerialStatus().isConnected,
                });
            }

            case 'ports': {
                const ports = await listSerialPorts();
                return NextResponse.json({ success: true, ports });
            }

            default:
                return NextResponse.json(
                    { success: false, message: `Action tidak dikenal: ${action}` },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Serial GET error:', error);
        return NextResponse.json(
            { success: false, message: 'Terjadi kesalahan' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/serial
 * Body:
 *   action = connect | disconnect | send
 *   config = { path, baudRate, dataBits, parity, stopBits, delimiter } (for connect)
 *   data = string (for send)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, config, data } = body;

        switch (action) {
            case 'connect': {
                const success = await connectSerial(config || {});
                const status = getSerialStatus();
                return NextResponse.json({
                    success,
                    message: success
                        ? `Terhubung ke ${status.portPath}`
                        : `Gagal terhubung: ${status.error}`,
                    ...status,
                });
            }

            case 'disconnect': {
                const success = await disconnectSerial();
                return NextResponse.json({
                    success,
                    message: success ? 'Koneksi diputus' : 'Gagal memutus koneksi',
                });
            }

            case 'send': {
                if (!data) {
                    return NextResponse.json(
                        { success: false, message: 'Data tidak boleh kosong' },
                        { status: 400 }
                    );
                }
                const success = await sendSerial(data);
                return NextResponse.json({
                    success,
                    message: success ? 'Data terkirim' : 'Gagal mengirim data',
                });
            }

            default:
                return NextResponse.json(
                    { success: false, message: `Action tidak dikenal: ${action}` },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Serial POST error:', error);
        return NextResponse.json(
            { success: false, message: 'Terjadi kesalahan' },
            { status: 500 }
        );
    }
}
