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
            orderBy: { createdAt: 'desc' }
        });
    }

    public async getById(id: string): Promise<ProductCategory | null> {
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

    public async update(id: string, params: Partial<ProductCategoryCreationParams>): Promise<ProductCategory> {
        return prisma.productCategory.update({
            where: { id },
            data: params
        });
    }

    public async delete(id: string): Promise<ProductCategory> {
        const usageCount = await prisma.product.count({
            where: { categoryId: id }
        });

        if (usageCount > 0) {
            throw new Error(`Cannot delete category as it is linked to ${usageCount} products.`);
        }

        return prisma.productCategory.delete({
            where: { id }
        });
    }
}
