import { User, Role, UserStatus } from "@prisma/client";
import { prisma } from "../repositories/prismaContext";
import { injectable } from "inversify";
import bcrypt from "bcryptjs";

export interface UserCreationParams {
    email: string;
    role: Role;
    password?: string;
}

@injectable()
export class UserService {
    public async getAll(): Promise<User[]> {
        return prisma.user.findMany({
            where: {
                status: {
                    not: UserStatus.DELETED
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    public async getById(id: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { id }
        });
    }

    public async create(params: UserCreationParams): Promise<User> {
        const passwordHash = await bcrypt.hash(params.password || "password123", 10);
        return prisma.user.create({
            data: {
                email: params.email,
                passwordHash,
                role: params.role
            }
        });
    }

    public async delete(id: string): Promise<User> {
        return prisma.user.update({
            where: { id },
            data: { status: UserStatus.DELETED }
        });
    }

    public async seedInitialUsers(): Promise<void> {
        const count = await prisma.user.count();
        if (count === 0) {
            const passwordHash = await bcrypt.hash("password", 10);
            await prisma.user.createMany({
                data: [
                    { email: "admin@kdm.com", passwordHash, role: Role.ADMIN },
                    { email: "purchase@kdm.com", passwordHash, role: Role.PURCHASE_MANAGER },
                    { email: "finance@kdm.com", passwordHash, role: Role.FINANCE },
                    { email: "ops@kdm.com", passwordHash, role: Role.OPERATIONS },
                ]
            });
            console.log("Initial users seeded with hashed passwords.");
        }
    }
}
