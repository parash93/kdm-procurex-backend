import { Product, EntityStatus } from "@prisma/client";
import { prisma } from "../repositories/prismaContext";
import { injectable } from "inversify";

export interface ProductCreationParams {
    name: string;
    categoryId: string;
    description?: string;
    status?: EntityStatus;
}

@injectable()
export class ProductService {
    public async getAll(): Promise<Product[]> {
        return prisma.product.findMany({
            where: {
                status: {
                    not: EntityStatus.DELETED
                }
            },
            include: { category: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    public async getById(id: string): Promise<Product | null> {
        return prisma.product.findUnique({
            where: { id },
            include: { category: true }
        });
    }

    public async create(params: ProductCreationParams): Promise<Product> {
        return prisma.product.create({
            data: {
                ...params,
                status: params.status || EntityStatus.ACTIVE
            },
            include: { category: true }
        });
    }

    public async update(id: string, params: Partial<ProductCreationParams>): Promise<Product> {
        return prisma.product.update({
            where: { id },
            data: params,
            include: { category: true }
        });
    }

    public async delete(id: string): Promise<Product> {
        return prisma.product.update({
            where: { id },
            data: { status: EntityStatus.DELETED },
            include: { category: true }
        });
    }
}
