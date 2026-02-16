import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('ProcureX@9192', 10);

    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {
            role: Role.ADMIN,
            passwordHash
        },
        create: {
            username: 'admin',
            passwordHash,
            role: Role.ADMIN,
        },
    });

    console.log('Created/Updated Admin User:', admin.username);

    const opsPasswordHash = await bcrypt.hash('ProcureX@ops', 10);
    const ops = await prisma.user.upsert({
        where: { username: 'ops' },
        update: {
            role: Role.OPERATIONS,
            passwordHash: opsPasswordHash
        },
        create: {
            username: 'ops',
            passwordHash: opsPasswordHash,
            role: Role.OPERATIONS,
        },
    });

    console.log('Created/Updated Ops User:', ops.username);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
