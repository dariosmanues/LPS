import crypto from 'node:crypto';
import { prisma } from './prisma';

export const FIKRI_EXCLUSIVE_EMAIL = 'fikri@lps.pekanbaru.go.id';

export function isFikriExclusiveUser(email?: string | null): boolean {
    return (email || '').toLowerCase().trim() === FIKRI_EXCLUSIVE_EMAIL;
}

export function parseDeviceSummary(userAgent?: string | null): string {
    const ua = (userAgent || '').trim();
    if (!ua || ua === 'unknown') return 'Perangkat Tidak Diketahui';

    let os = 'OS Lainnya';
    let isDesktopModeOnMobile = false;
    if (/Android/i.test(ua)) {
        const m = ua.match(/Android\s+([0-9.]+)/i);
        os = m ? `Android ${m[1]}` : 'Android';
    } else if (/X11;\s*Linux\s+x86_64/i.test(ua) && /Chrome\/1[45]\d/i.test(ua)) {
        os = 'Android (Mode Situs Desktop)';
        isDesktopModeOnMobile = true;
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
        os = 'iOS (iPhone/iPad)';
    } else if (/Windows NT 10\.0/i.test(ua)) {
        os = 'Windows 10/11 PC';
    } else if (/Windows/i.test(ua)) {
        os = 'Windows PC';
    } else if (/Mac OS X/i.test(ua)) {
        os = 'macOS';
    } else if (/Linux/i.test(ua)) {
        os = 'Linux';
    }

    let browser = 'Browser';
    if (/SamsungBrowser\/([0-9.]+)/i.test(ua)) {
        browser = `Samsung Browser ${ua.match(/SamsungBrowser\/([0-9.]+)/i)?.[1] || ''}`;
    } else if (/VivoBrowser\/([0-9.]+)/i.test(ua)) {
        browser = `Vivo Browser ${ua.match(/VivoBrowser\/([0-9.]+)/i)?.[1] || ''}`;
    } else if (/Edg\/([0-9.]+)/i.test(ua)) {
        browser = `Edge ${ua.match(/Edg\/([0-9.]+)/i)?.[1]?.split('.')[0] || ''}`;
    } else if (/Chrome\/([0-9.]+)/i.test(ua)) {
        browser = `Chrome ${ua.match(/Chrome\/([0-9.]+)/i)?.[1]?.split('.')[0] || ''}`;
    } else if (/Firefox\/([0-9.]+)/i.test(ua)) {
        browser = `Firefox ${ua.match(/Firefox\/([0-9.]+)/i)?.[1]?.split('.')[0] || ''}`;
    } else if (/Safari\/([0-9.]+)/i.test(ua) && !/Chrome/i.test(ua)) {
        browser = 'Safari';
    }

    const isMobile = /Mobile|Android|iPhone/i.test(ua) || isDesktopModeOnMobile;
    const typeLabel = isMobile ? '📱 HP/Mobile' : '💻 Desktop/PC';
    return `${typeLabel} • ${os} • ${browser}`.trim();
}

export function extractHeadersInfo(
    headersLike?: Headers | Record<string, string | string[] | undefined> | null
): { clientIp: string; userAgent: string } {
    if (!headersLike) return { clientIp: 'unknown', userAgent: 'unknown' };

    const getHeader = (name: string): string | null => {
        if (typeof (headersLike as Headers).get === 'function') {
            return (headersLike as Headers).get(name);
        }
        const rec = headersLike as Record<string, string | string[] | undefined>;
        const val = rec[name] ?? rec[name.toLowerCase()];
        if (Array.isArray(val)) return val[0] || null;
        return val || null;
    };

    const forwarded = getHeader('x-forwarded-for');
    const realIp = getHeader('x-real-ip');
    const cfIp = getHeader('cf-connecting-ip');

    let clientIp = 'unknown';
    if (forwarded) clientIp = forwarded.split(',')[0].trim();
    else if (realIp) clientIp = realIp.trim();
    else if (cfIp) clientIp = cfIp.trim();

    const userAgent = (getHeader('user-agent') || 'unknown').slice(0, 300);
    return { clientIp, userAgent };
}

let tableEnsured = false;

export async function ensureUserActivityTable(): Promise<void> {
    if (tableEnsured) return;
    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS user_activity_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                user_email TEXT NOT NULL,
                user_name TEXT,
                user_role TEXT,
                action TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'GENERAL',
                description TEXT NOT NULL,
                target_path TEXT,
                ip_address TEXT,
                user_agent TEXT,
                device_summary TEXT,
                metadata TEXT DEFAULT '{}',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs (created_at DESC);
        `);
        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS idx_user_activity_logs_email ON user_activity_logs (user_email);
        `);
        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action ON user_activity_logs (action);
        `);
        tableEnsured = true;
    } catch (err) {
        console.error('[UserActivityLogger] Table init error:', err);
    }
}

export interface LogUserActivityParams {
    userId?: string | null;
    userEmail: string;
    userName?: string | null;
    userRole?: string | null;
    action:
        | 'LOGIN_SUCCESS'
        | 'LOGIN_FAILED'
        | 'LOGOUT'
        | 'CHANGE_PASSWORD'
        | 'CREATE_USER'
        | 'UPDATE_USER'
        | 'DELETE_USER'
        | 'REGENERATE_QR'
        | 'REGENERATE_ALL_QR'
        | 'PAGE_VIEW'
        | 'DATA_ACTION';
    category?: 'AUTH' | 'PASSWORD' | 'USER_MGMT' | 'QR_CODE' | 'NAVIGATION' | 'DATA_ACTION';
    description: string;
    targetPath?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown>;
}

export function logUserActivity(params: LogUserActivityParams): void {
    const id = crypto.randomUUID();
    const email = (params.userEmail || 'unknown').toLowerCase().trim();
    const ua = params.userAgent || 'unknown';
    const deviceSummary = parseDeviceSummary(ua);
    const category =
        params.category ||
        (params.action.startsWith('LOGIN') || params.action === 'LOGOUT'
            ? 'AUTH'
            : params.action === 'CHANGE_PASSWORD'
                ? 'PASSWORD'
                : params.action.includes('USER')
                    ? 'USER_MGMT'
                    : params.action.includes('QR')
                        ? 'QR_CODE'
                        : params.action === 'PAGE_VIEW'
                            ? 'NAVIGATION'
                            : 'DATA_ACTION');

    (async () => {
        try {
            await ensureUserActivityTable();
            await prisma.$executeRawUnsafe(
                `INSERT INTO user_activity_logs (
                    id, user_id, user_email, user_name, user_role,
                    action, category, description, target_path,
                    ip_address, user_agent, device_summary, metadata, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
                id,
                params.userId || null,
                email,
                params.userName || null,
                params.userRole || null,
                params.action,
                category,
                params.description,
                params.targetPath || null,
                params.ipAddress || 'unknown',
                ua,
                deviceSummary,
                JSON.stringify(params.metadata || {})
            );
        } catch (err) {
            console.error('[UserActivityLogger] Insert error:', err);
        }
    })();
}
