import { Division, EntityStatus, Prisma } from "@prisma/client";
import { prisma } from "../repositories/prismaContext";
import { injectable, inject } from "inversify";
import { PaginatedResult } from "../types/pagination";
import { AuditService } from "./auditService";

export interface DivisionCreationParams {
    name: string;
    contactPerson?: string;
    status?: EntityStatus;
}

@injectable()
export class DivisionService {
    constructor(@inject(AuditService) private auditService: AuditService) { }

    public async getAll(): Promise<Division[]> {
        return prisma.division.findMany({
            where: {
                status: {
                    not: EntityStatus.DELETED
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    public async getPaginated(
        page: number = 1,
        limit: number = 10,
        search?: string
    ): Promise<PaginatedResult<Division>> {
        const where: Prisma.DivisionWhereInput = {
            status: { not: EntityStatus.DELETED },
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
                    { contactPerson: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
                ],
            }),
        };

        const [total, data] = await prisma.$transaction([
            prisma.division.count({ where }),
            prisma.division.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    public async getById(id: number): Promise<Division | null> {
        return prisma.division.findUnique({
            where: { id }
        });
    }

    public async create(params: DivisionCreationParams, userId?: number, username?: string): Promise<Division> {
        const division = await prisma.division.create({
            data: {
                ...params,
                status: params.status || EntityStatus.ACTIVE
            }
        });

        this.auditService.log({
            entityType: "DIVISION",
            entityId: division.id,
            action: "CREATE",
            userId,
            username,
            newData: division,
        });

        return division;
    }

    public async update(id: number, params: Partial<DivisionCreationParams>, userId?: number, username?: string): Promise<Division> {
        const previous = await prisma.division.findUnique({ where: { id } });

        const division = await prisma.division.update({
            where: { id },
            data: params
        });

        this.auditService.log({
            entityType: "DIVISION",
            entityId: id,
            action: "UPDATE",
            userId,
            username,
            previousData: previous,
            newData: division,
        });

        return division;
    }

    public async delete(id: number, userId?: number, username?: string): Promise<Division> {
        const previous = await prisma.division.findUnique({ where: { id } });

        const division = await prisma.division.update({
            where: { id },
            data: { status: EntityStatus.DELETED }
        });

        this.auditService.log({
            entityType: "DIVISION",
            entityId: id,
            action: "DELETE",
            userId,
            username,
            previousData: previous,
        });

        return division;
    }
}
