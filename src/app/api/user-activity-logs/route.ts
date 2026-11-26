import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import {
    ensureUserActivityTable,
    extractHeadersInfo,
    isFikriExclusiveUser,
    logUserActivity,
} from '@/lib/user-activity-logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ActivityLogRow {
    id: string;
    user_id: string | null;
    user_email: string;
    user_name: string | null;
    user_role: string | null;
    action: string;
    category: string;
    description: string;
    target_path: string | null;
    ip_address: string | null;
    user_agent: string | null;
    device_summary: string | null;
    metadata: string | null;
    created_at: Date;
}

const ipGeoCache = new Map<
    string,
    {
        ip: string;
        city: string;
        region: string;
        country: string;
        isp: string;
        as: string;
        mobile: boolean;
        proxy: boolean;
        connectionType: string;
        lat: number | null;
        lon: number | null;
    }
>();

async function lookupIpDetails(ip: string) {
    const cleanIp = ip.trim();
    if (!cleanIp || cleanIp === 'unknown' || cleanIp === '127.0.0.1' || cleanIp === '::1') {
        return {
            ip: cleanIp,
            city: 'Local / Internal Server',
            region: 'Pekanbaru',
            country: 'Indonesia',
            isp: 'Internal VPS Network',
            as: 'LOCAL',
            mobile: false,
            proxy: false,
            connectionType: '🖥️ Internal Server',
            lat: null,
            lon: null,
        };
    }

    const cached = ipGeoCache.get(cleanIp);
    if (cached) return cached;

    try {
        const res = await fetch(
            `http://ip-api.com/json/${encodeURIComponent(cleanIp)}?fields=status,country,regionName,city,lat,lon,isp,org,as,asname,mobile,proxy`,
            { signal: AbortSignal.timeout(4500) }
        );
        const data = await res.json();
        if (data && data.status === 'success') {
            const isCellular =
                Boolean(data.mobile) ||
                /Selular|Telkomsel|Hutchison|Indosat|XL|Axis|Smartfren/i.test(`${data.isp} ${data.as}`) &&
                    !/Telkom Indonesia|IndiHome|Biznet|First Media|MyRepublic|Icon\+/i.test(data.isp || '');
            const info = {
                ip: cleanIp,
                city: data.city || '-',
                region: data.regionName || '-',
                country: data.country || 'Indonesia',
                isp: data.isp || data.org || '-',
                as: data.as || '-',
                mobile: isCellular,
                proxy: Boolean(data.proxy),
                connectionType: isCellular
                    ? '📱 Data Seluler (Kartu SIM / Mobile Data)'
                    : '🌐 WiFi / Fixed Broadband (Kabel/Fiber)',
                lat: typeof data.lat === 'number' ? data.lat : null,
                lon: typeof data.lon === 'number' ? data.lon : null,
            };
            ipGeoCache.set(cleanIp, info);
            return info;
        }
    } catch {
        // ignore network lookup timeout
    }

    return {
        ip: cleanIp,
        city: 'Pekanbaru',
        region: 'Riau',
        country: 'Indonesia',
        isp: 'Provider Indonesia',
        as: '-',
        mobile: false,
        proxy: false,
        connectionType: '🌐 Jaringan Internet',
        lat: null,
        lon: null,
    };
}

// GET: Strictly ONLY for fikri@lps.pekanbaru.go.id
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !isFikriExclusiveUser(session.user.email)) {
            return NextResponse.json(
                { error: 'Forbidden - Akses khusus akun fikri@lps.pekanbaru.go.id' },
                { status: 403 }
            );
        }

        await ensureUserActivityTable();

        const { searchParams } = new URL(request.url);
        const lookupIp = searchParams.get('lookupIp')?.trim();
        if (lookupIp) {
            const geo = await lookupIpDetails(lookupIp);
            return NextResponse.json({ success: true, geo });
        }

        const search = (searchParams.get('search') || '').trim();
        const emailFilter = (searchParams.get('email') || '').trim().toLowerCase();
        const categoryFilter = (searchParams.get('category') || '').trim().toUpperCase();
        const actionFilter = (searchParams.get('action') || '').trim().toUpperCase();
        const limit = Math.min(500, Math.max(20, parseInt(searchParams.get('limit') || '200', 10)));

        const conditions: string[] = [];
        const params: unknown[] = [];

        if (emailFilter && emailFilter !== 'all') {
            params.push(emailFilter);
            conditions.push(`LOWER(user_email) = $${params.length}`);
        }
        if (categoryFilter && categoryFilter !== 'ALL') {
            params.push(categoryFilter);
            conditions.push(`UPPER(category) = $${params.length}`);
        }
        if (actionFilter && actionFilter !== 'ALL') {
            params.push(actionFilter);
            conditions.push(`UPPER(action) = $${params.length}`);
        }
        if (search) {
            params.push(`%${search.toLowerCase()}%`);
            const idx = params.length;
            conditions.push(
                `(LOWER(user_email) LIKE $${idx} OR LOWER(COALESCE(user_name, '')) LIKE $${idx} OR LOWER(description) LIKE $${idx} OR LOWER(COALESCE(ip_address, '')) LIKE $${idx} OR LOWER(COALESCE(target_path, '')) LIKE $${idx})`
            );
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        params.push(limit);

        const logs = await prisma.$queryRawUnsafe<ActivityLogRow[]>(
            `SELECT id, user_id, user_email, user_name, user_role, action, category,
                    description, target_path, ip_address, user_agent, device_summary,
                    metadata, created_at
             FROM user_activity_logs
             ${whereClause}
             ORDER BY created_at DESC
             LIMIT $${params.length}`,
            ...params
        );

        // Fetch per-user aggregated activity summary across all users in lps_db.users
        const userSummaries = await prisma.$queryRawUnsafe<
            Array<{
                id: string;
                email: string;
                name: string;
                role: string;
                kelurahan_nama: string | null;
                kecamatan_nama: string | null;
                created_at: Date;
                updated_at: Date;
                total_logs: number;
                login_success_count: number;
                login_failed_count: number;
                password_change_count: number;
                last_activity_at: Date | null;
                last_ip: string | null;
                last_device: string | null;
                last_action: string | null;
                last_description: string | null;
            }>
        >(`
            SELECT
                u.id,
                u.email,
                u.name,
                u.role,
                k.nama AS kelurahan_nama,
                kc.nama AS kecamatan_nama,
                u.created_at,
                u.updated_at,
                COALESCE(stats.total_logs, 0)::int AS total_logs,
                COALESCE(stats.login_success_count, 0)::int AS login_success_count,
                COALESCE(stats.login_failed_count, 0)::int AS login_failed_count,
                COALESCE(stats.password_change_count, 0)::int AS password_change_count,
                latest.created_at AS last_activity_at,
                latest.ip_address AS last_ip,
                latest.device_summary AS last_device,
                latest.action AS last_action,
                latest.description AS last_description
            FROM users u
            LEFT JOIN kelurahan k ON k.id = u.kelurahan_id
            LEFT JOIN kecamatan kc ON kc.id = k.kecamatan_id
            LEFT JOIN (
                SELECT
                    LOWER(user_email) AS email_key,
                    COUNT(*) AS total_logs,
                    COUNT(*) FILTER (WHERE action = 'LOGIN_SUCCESS') AS login_success_count,
                    COUNT(*) FILTER (WHERE action = 'LOGIN_FAILED') AS login_failed_count,
                    COUNT(*) FILTER (WHERE action = 'CHANGE_PASSWORD') AS password_change_count
                FROM user_activity_logs
                GROUP BY LOWER(user_email)
            ) stats ON stats.email_key = LOWER(u.email)
            LEFT JOIN LATERAL (
                SELECT created_at, ip_address, device_summary, action, description
                FROM user_activity_logs l
                WHERE LOWER(l.user_email) = LOWER(u.email)
                ORDER BY l.created_at DESC
                LIMIT 1
            ) latest ON true
            WHERE u.role != 'SYSTEM_INTEGRATION'
            ORDER BY COALESCE(latest.created_at, u.updated_at) DESC, u.role ASC, u.email ASC
        `);

        const kpiCounts = await prisma.$queryRawUnsafe<
            Array<{
                total_events: number;
                total_logins: number;
                total_failed_logins: number;
                total_password_changes: number;
                total_qr_regenerations: number;
                unique_active_users: number;
                unique_ips: number;
            }>
        >(`
            SELECT
                COUNT(*)::int AS total_events,
                COUNT(*) FILTER (WHERE action = 'LOGIN_SUCCESS')::int AS total_logins,
                COUNT(*) FILTER (WHERE action = 'LOGIN_FAILED')::int AS total_failed_logins,
                COUNT(*) FILTER (WHERE action = 'CHANGE_PASSWORD')::int AS total_password_changes,
                COUNT(*) FILTER (WHERE category = 'QR_CODE')::int AS total_qr_regenerations,
                COUNT(DISTINCT LOWER(user_email))::int AS unique_active_users,
                COUNT(DISTINCT ip_address) FILTER (WHERE ip_address IS NOT NULL AND ip_address != 'unknown')::int AS unique_ips
            FROM user_activity_logs
        `);

        return NextResponse.json(
            {
                success: true,
                kpi: kpiCounts[0] || {
                    total_events: 0,
                    total_logins: 0,
                    total_failed_logins: 0,
                    total_password_changes: 0,
                    total_qr_regenerations: 0,
                    unique_active_users: 0,
                    unique_ips: 0,
                },
                logs,
                users: userSummaries,
            },
            {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                },
            }
        );
    } catch (error) {
        console.error('[API /user-activity-logs GET]', error);
        return NextResponse.json(
            { error: 'Gagal memuat data log aktivitas user' },
            { status: 500 }
        );
    }
}

// POST: Record page navigation or logout activity from any authenticated user
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ ok: false }, { status: 200 });
        }

        const body = await request.json().catch(() => ({}));
        const path = typeof body.path === 'string' ? body.path.trim() : '';
        const actionType = body.action === 'LOGOUT' ? 'LOGOUT' : 'PAGE_VIEW';
        const pageTitle = typeof body.title === 'string' ? body.title.trim() : path;

        // Do not log Fikri's own visits to /dashboard/user-activity-logs to avoid self-clutter
        if (path.startsWith('/dashboard/user-activity-logs')) {
            return NextResponse.json({ ok: true, skipped: true });
        }

        const { clientIp, userAgent } = extractHeadersInfo(request.headers);

        logUserActivity({
            userId: session.user.id || null,
            userEmail: session.user.email,
            userName: session.user.name || null,
            userRole: session.user.role || null,
            action: actionType,
            category: actionType === 'LOGOUT' ? 'AUTH' : 'NAVIGATION',
            description:
                actionType === 'LOGOUT'
                    ? `User keluar (Sign Out) dari halaman ${path || '/'}`
                    : `Membuka menu / halaman ${pageTitle || path}`,
            targetPath: path || null,
            ipAddress: clientIp,
            userAgent,
        });

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ ok: false }, { status: 200 });
    }
}
