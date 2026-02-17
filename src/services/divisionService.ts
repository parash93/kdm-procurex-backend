import { Division, EntityStatus, Prisma } from "@prisma/client";
import { prisma } from "../repositories/prismaContext";
import { injectable } from "inversify";
import { PaginatedResult } from "../types/pagination";

export interface DivisionCreationParams {
    name: string;
    contactPerson?: string;
    status?: EntityStatus;
}

@injectable()
export class DivisionService {
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

    public async create(params: DivisionCreationParams): Promise<Division> {
        return prisma.division.create({
            data: {
                ...params,
                status: params.status || EntityStatus.ACTIVE
            }
        });
    }

    public async update(id: number, params: Partial<DivisionCreationParams>): Promise<Division> {
        return prisma.division.update({
            where: { id },
            data: params
        });
    }

    public async delete(id: number): Promise<Division> {
        return prisma.division.update({
            where: { id },
            data: { status: EntityStatus.DELETED }
        });
    }
}
