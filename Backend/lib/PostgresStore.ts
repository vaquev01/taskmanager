import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Custom PostgreSQL store for whatsapp-web.js RemoteAuth.
 * Stores session zip as base64 in the WhatsAppSession table.
 */
export class PostgresStore {
    async sessionExists(options: { session: string }): Promise<boolean> {
        const sessionName = path.basename(options.session);
        const record = await (prisma as any).whatsAppSession.findUnique({
            where: { session: sessionName }
        });
        return !!record;
    }

    async save(options: { session: string }): Promise<void> {
        const sessionName = path.basename(options.session);
        const zipPath = `${options.session}.zip`;

        if (!fs.existsSync(zipPath)) {
            console.error(`[PostgresStore] Zip not found: ${zipPath}`);
            return;
        }

        const data = fs.readFileSync(zipPath).toString('base64');
        const sizeMB = (Buffer.byteLength(data, 'utf8') / (1024 * 1024)).toFixed(2);
        console.log(`💾 [PostgresStore] Saving session "${sessionName}" (${sizeMB} MB base64)`);

        await (prisma as any).whatsAppSession.upsert({
            where: { session: sessionName },
            update: { data },
            create: { session: sessionName, data }
        });

        console.log(`✅ [PostgresStore] Session "${sessionName}" saved to PostgreSQL`);
    }

    async extract(options: { session: string; path: string }): Promise<void> {
        const sessionName = path.basename(options.session);
        console.log(`📦 [PostgresStore] Extracting session "${sessionName}"`);

        const record = await (prisma as any).whatsAppSession.findUnique({
            where: { session: sessionName }
        });

        if (!record) {
            console.error(`[PostgresStore] Session "${sessionName}" not found in DB`);
            return;
        }

        const dir = path.dirname(options.path);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(options.path, Buffer.from(record.data, 'base64'));
        console.log(`✅ [PostgresStore] Session extracted to ${options.path}`);
    }

    async delete(options: { session: string }): Promise<void> {
        const sessionName = path.basename(options.session);
        console.log(`🗑️ [PostgresStore] Deleting session "${sessionName}"`);

        try {
            await (prisma as any).whatsAppSession.delete({
                where: { session: sessionName }
            });
        } catch (e) {
            // Session might not exist
        }
    }
}
