import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get the first kelurahan for demonstration purposes.
    // In a real app, this would be based on the logged-in user's session.
    let kelurahan = await prisma.kelurahan.findFirst()

    // If no kelurahan exists yet (e.g., database just seeded/created), return a default one
    if (!kelurahan) {
      kelurahan = await prisma.kelurahan.create({
        data: {
          nama: 'Sukolilo',
          kecamatan: 'Bulak',
        }
      })
    }

    return NextResponse.json({
      success: true,
      kelurahan
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
