import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/error.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this';

export class AuthService {
    async login(identifier: string, password_plain: string) {
        // Find user by email or phone
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { telefone_whatsapp: identifier }
                ]
            }
        });

        if (!user) {
            throw new AppError('Credenciais inválidas', 401);
        }

        // Check password
        if (!user.password_hash) {
            // Migration phase: allow login if password matches default '123456' 
            // AND we update the hash. Or fail? -> Let's fail and require migration script.
            // But for user experience, let's say if no password_hash, we check if password is '123456' and set it?
            // No, stick to security.
            throw new AppError('Usuário sem senha configurada. Contate o suporte.', 401);
        }

        const isPasswordValid = await bcrypt.compare(password_plain, user.password_hash);
        if (!isPasswordValid) {
            throw new AppError('Credenciais inválidas', 401);
        }

        // Generate Token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Remove password from response
        const { password_hash, ...userBuffer } = user;

        return { user: userBuffer, token };
    }

    async register(data: any) {
        const { password, ...userData } = data;

        // Hash password (default to 123456 if not provided? No, require it or set default)
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password || '123456', salt);

        const user = await prisma.user.create({
            data: {
                ...userData,
                password_hash: hash
            }
        });

        const { password_hash, ...userBuffer } = user;
        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return { user: userBuffer, token };
    }
}
