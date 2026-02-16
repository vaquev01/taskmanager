/**
 * Strips sensitive fields (password_hash) from user objects.
 * Works with single objects, arrays, and nested includes.
 */
export function stripPassword<T extends Record<string, any>>(obj: T): Omit<T, 'password_hash'> {
    if (!obj) return obj;
    const { password_hash, ...safe } = obj;
    return safe as Omit<T, 'password_hash'>;
}

export function stripPasswords<T extends Record<string, any>>(arr: T[]): Omit<T, 'password_hash'>[] {
    return arr.map(stripPassword);
}

/**
 * Prisma select object that excludes password_hash from User queries.
 * Use as: prisma.user.findMany({ select: USER_SAFE_SELECT })
 */
export const USER_SAFE_SELECT = {
    id: true,
    nome: true,
    telefone_whatsapp: true,
    email: true,
    avatar: true,
    timezone: true,
    persona: true,
    role: true,
    dailySummaryTime: true,
    created_at: true,
} as const;
