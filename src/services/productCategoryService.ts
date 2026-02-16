import { ProductCategory, EntityStatus } from "@prisma/client";
import { prisma } from "../repositories/prismaContext";
import { injectable } from "inversify";

export interface ProductCategoryCreationParams {
    name: string;
    status?: EntityStatus;
}

@injectable()
export class ProductCategoryService {
    public async getAll(): Promise<ProductCategory[]> {
        return prisma.productCategory.findMany({
            where: {
                status: {
                    not: EntityStatus.DELETED
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    public async getById(id: number): Promise<ProductCategory | null> {
        return prisma.productCategory.findUnique({
            where: { id }
        });
    }

    public async create(params: ProductCategoryCreationParams): Promise<ProductCategory> {
        return prisma.productCategory.create({
            data: {
                ...params,
                status: params.status || EntityStatus.ACTIVE
            }
        });
    }

    public async update(id: number, params: Partial<ProductCategoryCreationParams>): Promise<ProductCategory> {
        return prisma.productCategory.update({
            where: { id },
            data: params
        });
    }

    public async delete(id: number): Promise<ProductCategory> {
        return prisma.productCategory.update({
            where: { id },
            data: { status: EntityStatus.DELETED }
        });
    }
}
