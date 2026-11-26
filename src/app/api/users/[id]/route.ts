import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { requireSuperAdmin } from '@/lib/permissions';
import { extractHeadersInfo, logUserActivity } from '@/lib/user-activity-logger';

// GET single user
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await prisma.user.findUnique({
            where: { id },
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

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
}

// PUT update user
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireSuperAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const { id } = await params;
        const body = await request.json();
        const { email, password, name, role, kelurahanId } = body;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
        }

        const normalizedEmail = email ? email.toLowerCase().trim() : undefined;

        // Check if email is taken by another user
        if (normalizedEmail && normalizedEmail !== existingUser.email) {
            const emailTaken = await prisma.user.findUnique({
                where: { email: normalizedEmail },
            });
            if (emailTaken) {
                return NextResponse.json({ error: 'Email sudah digunakan oleh user lain' }, { status: 400 });
            }
        }

        const targetRole = role !== undefined ? role : existingUser.role;
        const isLpsRole = ['LPS_KETUA', 'LPS_SEKRETARIS', 'LPS_BENDAHARA'].includes(targetRole);

        // Build update data
        const updateData: {
            email?: string;
            name?: string;
            role?: string;
            passwordHash?: string;
            kelurahanId?: string | null;
        } = {};

        if (normalizedEmail) updateData.email = normalizedEmail;
        if (name !== undefined) updateData.name = name.trim();
        if (role !== undefined) updateData.role = role;

        if (isLpsRole) {
            if (kelurahanId !== undefined) {
                updateData.kelurahanId = kelurahanId || null;
            }
        } else if (role !== undefined) {
            // Jika role diubah menjadi non-LPS (misal ADMIN/OPERATOR), lepaskan relasi kelurahanId
            updateData.kelurahanId = null;
        }

        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
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
                updatedAt: true,
            },
        });

        const { clientIp, userAgent } = extractHeadersInfo(request.headers);
        const actorEmail = auth.session?.user?.email || 'superadmin';
        const actorName = auth.session?.user?.name || actorEmail;
        if (password) {
            logUserActivity({
                userId: existingUser.id,
                userEmail: existingUser.email,
                userName: user.name,
                userRole: user.role,
                action: 'CHANGE_PASSWORD',
                category: 'PASSWORD',
                description: `Password akun ${existingUser.email} (${user.name}) diubah oleh ${actorName} (${actorEmail})`,
                targetPath: `/api/users/${id}`,
                ipAddress: clientIp,
                userAgent,
                metadata: {
                    changedByEmail: actorEmail,
                    changedByName: actorName,
                    targetEmail: existingUser.email,
                    targetName: user.name,
                },
            });
        } else {
            logUserActivity({
                userId: existingUser.id,
                userEmail: existingUser.email,
                userName: user.name,
                userRole: user.role,
                action: 'UPDATE_USER',
                category: 'USER_MGMT',
                description: `Data/role akun ${existingUser.email} (${user.name}) diperbarui oleh ${actorName} (${actorEmail})`,
                targetPath: `/api/users/${id}`,
                ipAddress: clientIp,
                userAgent,
                metadata: {
                    updatedByEmail: actorEmail,
                    targetEmail: existingUser.email,
                    newRole: user.role,
                },
            });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

// DELETE user
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireSuperAdmin();
    if (!auth.authorized) return auth.response;

    try {
        const { id } = await params;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        await prisma.user.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
