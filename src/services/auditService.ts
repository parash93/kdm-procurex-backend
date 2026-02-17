import { injectable } from "inversify";
import { prisma } from "../repositories/prismaContext";
import { Prisma } from "@prisma/client";
import { PaginatedResult } from "../types/pagination";

export interface AuditLogParams {
    entityType: string;
    entityId: number;
    action: string;
    userId?: number;
    username?: string;
    previousData?: any;
    newData?: any;
    metadata?: any;
}

/** DTO for API responses — avoids Prisma's `JsonValue` type that tsoa can't resolve */
export interface AuditLogResponse {
    id: number;
    entityType: string;
    entityId: number;
    action: string;
    userId: number | null;
    username: string | null;
    previousData: any;
    newData: any;
    metadata: any;
    createdAt: Date;
}

@injectable()
export class AuditService {
    /**
     * Log an audit event. This is fire-and-forget — errors are caught and
     * logged to console so they never break the main business flow.
     */
    public async log(params: AuditLogParams): Promise<void> {
        try {
            await prisma.auditLog.create({
                data: {
                    entityType: params.entityType,
                    entityId: params.entityId,
                    action: params.action,
                    userId: params.userId ?? null,
                    username: params.username ?? "SYSTEM",
                    previousData: params.previousData ? JSON.parse(JSON.stringify(params.previousData)) : Prisma.JsonNull,
                    newData: params.newData ? JSON.parse(JSON.stringify(params.newData)) : Prisma.JsonNull,
                    metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : Prisma.JsonNull,
                },
            });
        } catch (error) {
            console.error("Audit log write failed:", error);
        }
    }

    /**
     * Get paginated audit logs with optional filters.
     */
    public async getPaginated(
        page: number = 1,
        limit: number = 10,
        search?: string,
        entityType?: string,
        action?: string,
        entityId?: number
    ): Promise<PaginatedResult<AuditLogResponse>> {
        const where: Prisma.AuditLogWhereInput = {
            ...(entityType && { entityType }),
            ...(action && { action }),
            ...(entityId && { entityId }),
            ...(search && {
                OR: [
                    { username: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
                    { entityType: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
                    { action: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
                ],
            }),
        };

        const [total, rawData] = await prisma.$transaction([
            prisma.auditLog.count({ where }),
            prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);

        const data: AuditLogResponse[] = rawData.map(row => ({
            id: row.id,
            entityType: row.entityType,
            entityId: row.entityId,
            action: row.action,
            userId: row.userId,
            username: row.username,
            previousData: row.previousData,
            newData: row.newData,
            metadata: row.metadata,
            createdAt: row.createdAt,
        }));

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    /**
     * Get audit history for a specific entity.
     */
    public async getEntityHistory(entityType: string, entityId: number): Promise<AuditLogResponse[]> {
        const rawData = await prisma.auditLog.findMany({
            where: { entityType, entityId },
            orderBy: { createdAt: "desc" },
        });

        return rawData.map(row => ({
            id: row.id,
            entityType: row.entityType,
            entityId: row.entityId,
            action: row.action,
            userId: row.userId,
            username: row.username,
            previousData: row.previousData,
            newData: row.newData,
            metadata: row.metadata,
            createdAt: row.createdAt,
        }));
    }
}
