import { injectable } from "inversify";
import { prisma } from "../repositories/prismaContext";
import { Supplier, SupplierStatus } from "@prisma/client";

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
    public async get(id: string): Promise<Supplier | null> {
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

    public async create(params: SupplierCreationParams): Promise<Supplier> {
        return prisma.supplier.create({
            data: {
                ...params,
                status: params.status || SupplierStatus.ACTIVE,
            },
        });
    }

    public async update(id: string, params: Partial<SupplierCreationParams> & { status?: SupplierStatus }): Promise<Supplier> {
        return prisma.supplier.update({
            where: { id },
            data: params,
        });
    }

    public async delete(id: string): Promise<void> {
        await prisma.supplier.update({
            where: { id },
            data: { status: SupplierStatus.DELETED }
        });
    }
}
