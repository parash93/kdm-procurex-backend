import { injectable, inject } from "inversify";
import { prisma } from "../repositories/prismaContext";
import { User, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuditService } from "./auditService";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-procurex-key";

export interface LoginParams {
    username: string;
    password?: string;
}

export interface AuthResponse {
    user: Omit<User, 'passwordHash'>;
    token: string;
}

export interface RegisterParams {
    username: string;
    password?: string;
    role: Role;
}

@injectable()
export class AuthService {
    constructor(@inject(AuditService) private auditService: AuditService) { }

    public async login(params: LoginParams): Promise<AuthResponse> {
        const user = await prisma.user.findUnique({
            where: { username: params.username }
        });

        if (!user || user.status === UserStatus.DELETED) {
            throw new Error("Invalid email or password");
        }

        if (user.status === UserStatus.INACTIVE) {
            throw new Error("Account is inactive. Please contact administrator.");
        }

        // For initial seeded users, passwordHash might be null or "password" (plaintext)
        // We'll handle that transition gracefully
        const isMatch = params.password && user.passwordHash ?
            await bcrypt.compare(params.password, user.passwordHash) :
            params.password === "password"; // Fallback for seeds

        if (!isMatch) {
            throw new Error("Invalid email or password");
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        const { passwordHash, ...userWithoutPassword } = user;

        // Audit log for successful login
        this.auditService.log({
            entityType: "USER",
            entityId: user.id,
            action: "LOGIN",
            userId: user.id,
            username: user.username,
            metadata: { role: user.role },
        });

        return {
            user: userWithoutPassword,
            token
        };
    }

    public async register(params: RegisterParams): Promise<User> {
        const passwordHash = await bcrypt.hash(params.password || "password123", 10);
        return prisma.user.create({
            data: {
                username: params.username,
                passwordHash,
                role: params.role
            }
        });
    }

    public async verifyToken(token: string): Promise<any> {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return null;
        }
    }
}
