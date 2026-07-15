import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const kelurahans = await prisma.kelurahan.findMany({
            orderBy: {
                nama: 'asc'
            }
        })

        return NextResponse.json({ success: true, data: kelurahans })
    } catch (error) {
        console.error('Error fetching kelurahan:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch kelurahan' }, { status: 500 })
    }
}
