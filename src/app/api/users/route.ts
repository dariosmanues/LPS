import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { requireSuperAdmin } from '@/lib/permissions';

// GET all users
export async function GET() {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                kelurahanId: true,
                kelurahan: {
                    select: {
                        id: true,
                        nama: true,
                        kecamatan: {
                            select: { nama: true }
                        }
                    }
                },
                createdAt: true,
                updatedAt: true,
            },
        });
        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

// POST create new user
export async function POST(request: Request) {
    const auth = await requireSuperAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const body = await request.json();
        const { email, password, name, role, kelurahanId } = body;

        if (!email || !password || !name || !role) {
            return NextResponse.json({ error: 'Semua kolom wajib diisi' }, { status: 400 });
        }

        const isLpsRole = ['LPS_KETUA', 'LPS_SEKRETARIS', 'LPS_BENDAHARA'].includes(role);
        if (isLpsRole && !kelurahanId) {
            return NextResponse.json({ error: 'Kelurahan wajib dipilih untuk role LPS Kelurahan' }, { status: 400 });
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        if (existingUser) {
            return NextResponse.json({ error: 'Email sudah terdaftar di sistem' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase().trim(),
                passwordHash: hashedPassword,
                name: name.trim(),
                role,
                kelurahanId: isLpsRole && kelurahanId ? kelurahanId : null,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                kelurahanId: true,
                kelurahan: {
                    select: {
                        id: true,
                        nama: true,
                        kecamatan: {
                            select: { nama: true }
                        }
                    }
                },
                createdAt: true,
            },
        });

        return NextResponse.json(user, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
