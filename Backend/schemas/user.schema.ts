import { z } from 'zod';

export const loginSchema = z.object({
    identifier: z.string().min(1, "Email ou WhatsApp é obrigatório"),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres")
});

export const createUserSchema = z.object({
    nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
    telefone_whatsapp: z.string().min(10, "WhatsApp inválido"),
    email: z.string().email("Email inválido").optional().or(z.literal('')),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional(), // Optional for now, will default to 123456
    role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']).optional(),
    timezone: z.string().optional(),
    avatar: z.string().url().optional().or(z.literal(''))
});

export const updateUserSchema = z.object({
    nome: z.string().min(3).optional(),
    email: z.string().email().optional().or(z.literal('')),
    telefone_whatsapp: z.string().min(10).optional(),
    avatar: z.string().url().optional().or(z.literal('')),
    timezone: z.string().optional(),
    dailySummaryTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    password: z.string().min(6).optional()
});
