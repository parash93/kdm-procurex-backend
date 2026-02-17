import { ProductCategory, EntityStatus, Prisma } from "@prisma/client";
import { prisma } from "../repositories/prismaContext";
import { injectable, inject } from "inversify";
import { PaginatedResult } from "../types/pagination";
import { AuditService } from "./auditService";

export interface ProductCategoryCreationParams {
    name: string;
    status?: EntityStatus;
}

@injectable()
export class ProductCategoryService {
    constructor(@inject(AuditService) private auditService: AuditService) { }

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

    public async create(params: ProductCategoryCreationParams, userId?: number, username?: string): Promise<ProductCategory> {
        const category = await prisma.productCategory.create({
            data: {
                ...params,
                status: params.status || EntityStatus.ACTIVE
            }
        });

        this.auditService.log({
            entityType: "PRODUCT_CATEGORY",
            entityId: category.id,
            action: "CREATE",
            userId,
            username,
            newData: category,
        });

        return category;
    }

    public async update(id: number, params: Partial<ProductCategoryCreationParams>, userId?: number, username?: string): Promise<ProductCategory> {
        const previous = await prisma.productCategory.findUnique({ where: { id } });

        const category = await prisma.productCategory.update({
            where: { id },
            data: params
        });

        this.auditService.log({
            entityType: "PRODUCT_CATEGORY",
            entityId: id,
            action: "UPDATE",
            userId,
            username,
            previousData: previous,
            newData: category,
        });

        return category;
    }

    public async delete(id: number, userId?: number, username?: string): Promise<ProductCategory> {
        const previous = await prisma.productCategory.findUnique({ where: { id } });

        const category = await prisma.productCategory.update({
            where: { id },
            data: { status: EntityStatus.DELETED }
        });

        this.auditService.log({
            entityType: "PRODUCT_CATEGORY",
            entityId: id,
            action: "DELETE",
            userId,
            username,
            previousData: previous,
        });

        return category;
    }
}
