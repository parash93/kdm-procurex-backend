import { injectable } from "inversify";
import { prisma } from "../repositories/prismaContext";
import { Supplier, SupplierStatus, Prisma } from "@prisma/client";
import { PaginatedResult } from "../types/pagination";

export interface SupplierCreationParams {
    companyName: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
    paymentTerms?: string;
    status?: SupplierStatus;
}

@injectable()
export class SupplierService {
    public async get(id: number): Promise<Supplier | null> {
        return prisma.supplier.findUnique({ where: { id } });
    }

    public async getAll(): Promise<Supplier[]> {
        return prisma.supplier.findMany({
            where: {
                status: {
                    not: SupplierStatus.DELETED
                }
            }
        });
    }

    public async getPaginated(
        page: number = 1,
        limit: number = 10,
        search?: string
    ): Promise<PaginatedResult<Supplier>> {
        const where: Prisma.SupplierWhereInput = {
            status: { not: SupplierStatus.DELETED },
            ...(search && {
                OR: [
                    { companyName: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
                    { contactPerson: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
                    { email: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
                ],
            }),
        };

        const [total, data] = await prisma.$transaction([
            prisma.supplier.count({ where }),
            prisma.supplier.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    public async create(params: SupplierCreationParams): Promise<Supplier> {
        return prisma.supplier.create({
            data: {
                ...params,
                status: params.status || SupplierStatus.ACTIVE,
            },
        });
    }

    public async update(id: number, params: Partial<SupplierCreationParams> & { status?: SupplierStatus }): Promise<Supplier> {
        return prisma.supplier.update({
            where: { id },
            data: params,
        });
    }

    public async delete(id: number): Promise<void> {
        await prisma.supplier.update({
            where: { id },
            data: { status: SupplierStatus.DELETED }
        });
    }
}
