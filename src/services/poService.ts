import { injectable, inject } from "inversify";
import { prisma } from "../repositories/prismaContext";
import { PurchaseOrder, POStatus, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { PaginatedResult } from "../types/pagination";
import { AuditService } from "./auditService";

export interface CreatePOParams {
    supplierId: number;
    divisionId?: number;
    remarks?: string;
    poDate?: Date;
    items: {
        productId?: number;
        productName?: string;
        sku?: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        remarks?: string;
        expectedDeliveryDate?: Date;
    }[];
}

@injectable()
export class PurchaseOrderService {
    constructor(@inject(AuditService) private auditService: AuditService) { }

    public async create(params: CreatePOParams, userId?: number, username?: string): Promise<PurchaseOrder> {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        const poNumber = `PO-${dateStr}-${randomStr}`;

        const po = await prisma.purchaseOrder.create({
            data: {
                poNumber,
                supplierId: params.supplierId,
                divisionId: params.divisionId,
                remarks: params.remarks,
                poDate: params.poDate,
                status: POStatus.DRAFT,
                items: {
                    create: params.items.map(item => ({
                        productId: item.productId,
                        productName: item.productName || "Product",
                        sku: item.sku,
                        quantity: item.quantity,
                        unitPrice: new Decimal(item.unitPrice),
                        totalPrice: new Decimal(item.totalPrice),
                        remarks: item.remarks,
                        expectedDeliveryDate: item.expectedDeliveryDate
                    }))
                }
            },
            include: {
                items: true,
                supplier: true,
                division: true
            }
        });

        this.auditService.log({
            entityType: "ORDER",
            entityId: po.id,
            action: "CREATE",
            userId,
            username,
            newData: po,
            metadata: { poNumber },
        });

        return po;
    }

    public async getAll(): Promise<PurchaseOrder[]> {
        return prisma.purchaseOrder.findMany({
            where: {
                status: {
                    not: POStatus.DELETED
                }
            },
            include: {
                supplier: true,
                division: true,
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    public async getPaginated(
        page: number = 1,
        limit: number = 10,
        search?: string,
        status?: string
    ): Promise<PaginatedResult<PurchaseOrder>> {
        const where: Prisma.PurchaseOrderWhereInput = {
            status: { not: POStatus.DELETED },
            ...(status && status !== 'ALL' && {
                status: { equals: status as POStatus, not: POStatus.DELETED },
            }),
            ...(search && {
                OR: [
                    { poNumber: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
                    { supplier: { companyName: { contains: search, mode: 'insensitive' as Prisma.QueryMode } } },
                    { division: { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } } },
                ],
            }),
        };

        const [total, data] = await prisma.$transaction([
            prisma.purchaseOrder.count({ where }),
            prisma.purchaseOrder.findMany({
                where,
                include: {
                    supplier: true,
                    division: true,
                    items: { include: { product: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    public async getById(id: number): Promise<PurchaseOrder | null> {
        return prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                supplier: true,
                division: true,
                items: {
                    include: {
                        product: true
                    }
                },
                stageUpdates: {
                    include: {
                        updatedByUser: true
                    },
                    orderBy: {
                        timestamp: 'desc'
                    }
                },
                approvals: {
                    include: {
                        approver: true
                    }
                }
            }
        });
    }

    public async update(id: number, params: Partial<CreatePOParams & { status: POStatus, updatedByUsername?: number }>, userId?: number, username?: string): Promise<PurchaseOrder> {
        const { items, updatedByUsername, ...headerData } = params;

        return prisma.$transaction(async (tx) => {
            const currentPO = await tx.purchaseOrder.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!currentPO) throw new Error("PO not found");

            // Determine action type for audit
            let auditAction = "UPDATE";
            if (headerData.status && headerData.status !== currentPO.status) {
                auditAction = "STATUS_CHANGE";

                if (headerData.status === POStatus.PENDING_L1) {
                    auditAction = "SUBMIT";
                }
            }

            // Update header
            const updatedPO = await tx.purchaseOrder.update({
                where: { id },
                data: {
                    supplierId: headerData.supplierId,
                    divisionId: headerData.divisionId,
                    remarks: headerData.remarks,
                    status: headerData.status,
                }
            });

            // If items are provided, replace them
            if (items) {
                await tx.purchaseOrderItem.deleteMany({
                    where: { poId: id }
                });

                for (const item of items) {
                    await tx.purchaseOrderItem.create({
                        data: {
                            poId: id,
                            productId: item.productId,
                            productName: item.productName || "Product",
                            sku: item.sku,
                            quantity: item.quantity,
                            unitPrice: new Decimal(item.unitPrice),
                            totalPrice: new Decimal(item.totalPrice),
                            remarks: item.remarks,
                            expectedDeliveryDate: item.expectedDeliveryDate
                        }
                    });
                }
            }

            const finalPO = await tx.purchaseOrder.findUniqueOrThrow({
                where: { id },
                include: {
                    items: true,
                    supplier: true,
                    division: true
                }
            });

            // Fire-and-forget audit log (outside transaction)
            this.auditService.log({
                entityType: "ORDER",
                entityId: id,
                action: auditAction,
                userId,
                username,
                previousData: currentPO,
                newData: finalPO,
                metadata: {
                    poNumber: currentPO.poNumber,
                    previousStatus: currentPO.status,
                    newStatus: headerData.status || currentPO.status,
                },
            });

            return finalPO;
        });
    }

    public async delete(id: number, userId?: number, username?: string): Promise<void> {
        const previous = await prisma.purchaseOrder.findUnique({
            where: { id },
            include: { items: true, supplier: true, division: true }
        });

        await prisma.purchaseOrder.update({
            where: { id },
            data: { status: POStatus.DELETED }
        });

        this.auditService.log({
            entityType: "ORDER",
            entityId: id,
            action: "DELETE",
            userId,
            username,
            previousData: previous,
            metadata: { poNumber: previous?.poNumber },
        });
    }
}
