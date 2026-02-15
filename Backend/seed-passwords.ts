import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🔒 Seeding default passwords...');

    const users = await prisma.user.findMany({
        where: { password_hash: null }
    });

    console.log(`Found ${users.length} users wihtout password.`);

    if (users.length === 0) {
        console.log('✅ All users already have passwords.');
        return;
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('123456', salt);

    for (const user of users) {
        await prisma.user.update({
            where: { id: user.id },
            data: { password_hash: hash }
        });
        console.log(`✅ Password set for ${user.nome}`);
    }

    console.log('🎉 Done! Default password is "123456"');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
