import { Product, EntityStatus, Prisma } from "@prisma/client";
import { prisma } from "../repositories/prismaContext";
import { injectable } from "inversify";
import { PaginatedResult } from "../types/pagination";

export interface ProductCreationParams {
    name: string;
    categoryId: number;
    description?: string;
    minDeliveryDays?: number;
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
            include: {
                category: true,
                inventory: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    public async getPaginated(
        page: number = 1,
        limit: number = 10,
        search?: string
    ): Promise<PaginatedResult<Product>> {
        const where: Prisma.ProductWhereInput = {
            status: { not: EntityStatus.DELETED },
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
                    { description: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
                    { category: { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } } },
                ],
            }),
        };

        const [total, data] = await prisma.$transaction([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                include: { category: true, inventory: true },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    public async getById(id: number): Promise<Product | null> {
        return prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
                inventory: true
            }
        });
    }

    public async create(params: ProductCreationParams): Promise<Product> {
        const product = await prisma.product.create({
            data: {
                name: params.name,
                categoryId: params.categoryId,
                description: params.description,
                minDeliveryDays: params.minDeliveryDays || 0,
                status: params.status || EntityStatus.ACTIVE
            },
            include: { category: true }
        });

        // Initialize inventory
        await prisma.inventory.create({
            data: {
                productId: product.id,
                quantity: 0
            }
        });

        return product;
    }

    public async update(id: number, params: Partial<ProductCreationParams>): Promise<Product> {
        return prisma.product.update({
            where: { id },
            data: {
                name: params.name,
                categoryId: params.categoryId,
                description: params.description,
                minDeliveryDays: params.minDeliveryDays,
                status: params.status
            },
            include: { category: true }
        });
    }

    public async delete(id: number): Promise<Product> {
        return prisma.product.update({
            where: { id },
            data: { status: EntityStatus.DELETED },
            include: { category: true }
        });
    }
}
