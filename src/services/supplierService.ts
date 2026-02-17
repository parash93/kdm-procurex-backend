import { injectable, inject } from "inversify";
import { prisma } from "../repositories/prismaContext";
import { Supplier, SupplierStatus, Prisma } from "@prisma/client";
import { PaginatedResult } from "../types/pagination";
import { AuditService } from "./auditService";

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
    constructor(@inject(AuditService) private auditService: AuditService) { }

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

    public async create(params: SupplierCreationParams, userId?: number, username?: string): Promise<Supplier> {
        const supplier = await prisma.supplier.create({
            data: {
                ...params,
                status: params.status || SupplierStatus.ACTIVE,
            },
        });

        this.auditService.log({
            entityType: "SUPPLIER",
            entityId: supplier.id,
            action: "CREATE",
            userId,
            username,
            newData: supplier,
        });

        return supplier;
    }

    public async update(id: number, params: Partial<SupplierCreationParams> & { status?: SupplierStatus }, userId?: number, username?: string): Promise<Supplier> {
        const previous = await prisma.supplier.findUnique({ where: { id } });

        const supplier = await prisma.supplier.update({
            where: { id },
            data: params,
        });

        this.auditService.log({
            entityType: "SUPPLIER",
            entityId: id,
            action: "UPDATE",
            userId,
            username,
            previousData: previous,
            newData: supplier,
        });

        return supplier;
    }

    public async delete(id: number, userId?: number, username?: string): Promise<void> {
        const previous = await prisma.supplier.findUnique({ where: { id } });

        await prisma.supplier.update({
            where: { id },
            data: { status: SupplierStatus.DELETED }
        });

        this.auditService.log({
            entityType: "SUPPLIER",
            entityId: id,
            action: "DELETE",
            userId,
            username,
            previousData: previous,
        });
    }
}
