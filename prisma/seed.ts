import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('password', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@kdm.com' },
        update: {},
        create: {
            email: 'admin@kdm.com',
            passwordHash,
            role: Role.ADMIN,
        },
    });

    console.log({ admin });

    await prisma.user.upsert({
        where: { email: 'purchase@kdm.com' },
        update: {},
        create: {
            email: 'purchase@kdm.com',
            passwordHash,
            role: Role.PURCHASE_MANAGER,
        },
    });

    await prisma.user.upsert({
        where: { email: 'finance@kdm.com' },
        update: {},
        create: {
            email: 'finance@kdm.com',
            passwordHash,
            role: Role.FINANCE,
        },
    });

    await prisma.user.upsert({
        where: { email: 'ops@kdm.com' },
        update: {},
        create: {
            email: 'ops@kdm.com',
            passwordHash,
            role: Role.OPERATIONS,
        },
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
