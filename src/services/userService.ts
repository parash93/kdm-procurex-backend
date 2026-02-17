import { User, Role, UserStatus } from "@prisma/client";
import { prisma } from "../repositories/prismaContext";
import { injectable, inject } from "inversify";
import bcrypt from "bcryptjs";
import { AuditService } from "./auditService";

export interface UserCreationParams {
    username: string;
    role: Role;
    password?: string;
}

@injectable()
export class UserService {
    constructor(@inject(AuditService) private auditService: AuditService) { }

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

    public async getById(id: number): Promise<User | null> {
        return prisma.user.findUnique({
            where: { id }
        });
    }

    public async create(params: UserCreationParams, performedByUserId?: number, performedByUsername?: string): Promise<User> {
        const passwordHash = await bcrypt.hash(params.password || "password123", 10);
        const user = await prisma.user.create({
            data: {
                username: params.username,
                passwordHash,
                role: params.role
            }
        });

        this.auditService.log({
            entityType: "USER",
            entityId: user.id,
            action: "CREATE",
            userId: performedByUserId,
            username: performedByUsername,
            newData: { id: user.id, username: user.username, role: user.role, status: user.status },
        });

        return user;
    }

    public async delete(id: number, performedByUserId?: number, performedByUsername?: string): Promise<User> {
        const previous = await prisma.user.findUnique({ where: { id } });

        const user = await prisma.user.update({
            where: { id },
            data: { status: UserStatus.DELETED }
        });

        this.auditService.log({
            entityType: "USER",
            entityId: id,
            action: "DELETE",
            userId: performedByUserId,
            username: performedByUsername,
            previousData: previous ? { id: previous.id, username: previous.username, role: previous.role, status: previous.status } : null,
        });

        return user;
    }

    public async seedInitialUsers(): Promise<void> {
        const count = await prisma.user.count();
        if (count === 0) {
            const passwordHash = await bcrypt.hash("password", 10);
            await prisma.user.createMany({
                data: [
                    { username: "admin", passwordHash, role: Role.ADMIN },
                    { username: "ops", passwordHash, role: Role.OPERATIONS },
                ]
            });
            console.log("Initial users seeded with hashed passwords.");
        }
    }
}
