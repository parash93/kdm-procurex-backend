import { ProductCategory, EntityStatus, Prisma } from "@prisma/client";
import { prisma } from "../repositories/prismaContext";
import { injectable } from "inversify";
import { PaginatedResult } from "../types/pagination";

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

    public async getPaginated(
        page: number = 1,
        limit: number = 10,
        search?: string
    ): Promise<PaginatedResult<ProductCategory>> {
        const where: Prisma.ProductCategoryWhereInput = {
            status: { not: EntityStatus.DELETED },
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
                ],
            }),
        };

        const [total, data] = await prisma.$transaction([
            prisma.productCategory.count({ where }),
            prisma.productCategory.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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
