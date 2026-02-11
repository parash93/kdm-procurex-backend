import { User, Role } from "@prisma/client";
import { prisma } from "../repositories/prismaContext";
import { injectable } from "inversify";

export interface UserCreationParams {
    email: string;
    role: Role;
    password?: string;
}

@injectable()
export class UserService {
    public async getAll(): Promise<User[]> {
        return prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }

    public async getById(id: string): Promise<User | null> {
        return prisma.user.findUnique({
            where: { id }
        });
    }

    public async create(params: UserCreationParams): Promise<User> {
        return prisma.user.create({
            data: {
                email: params.email,
                passwordHash: "dummy-hash", // No auth implemented yet, using dummy
                role: params.role
            }
        });
    }

    public async delete(id: string): Promise<User> {
        return prisma.user.delete({
            where: { id }
        });
    }

    public async seedInitialUsers(): Promise<void> {
        const count = await prisma.user.count();
        if (count === 0) {
            await prisma.user.createMany({
                data: [
                    { email: "admin@kdm.com", passwordHash: "dummy", role: Role.ADMIN },
                    { email: "purchase@kdm.com", passwordHash: "dummy", role: Role.PURCHASE_MANAGER },
                    { email: "finance@kdm.com", passwordHash: "dummy", role: Role.FINANCE },
                    { email: "ops@kdm.com", passwordHash: "dummy", role: Role.OPERATIONS },
                ]
            });
            console.log("Initial users seeded.");
        }
    }
}
