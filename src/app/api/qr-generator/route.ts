import { NextRequest } from 'next/server';
import {
    handleOptions,
    handleTimbangQrGet,
    handleTimbangQrPost,
} from '@/lib/timbangqr-qr-service';

export const runtime = 'nodejs';

export async function OPTIONS() {
    return handleOptions();
}

export async function GET(request: NextRequest) {
    return handleTimbangQrGet(request);
}

export async function POST(request: NextRequest) {
    return handleTimbangQrPost(request);
}

export async function PUT(request: NextRequest) {
    return handleTimbangQrPost(request);
}
