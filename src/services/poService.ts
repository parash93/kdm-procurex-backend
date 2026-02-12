import { injectable } from "inversify";
import { prisma } from "../repositories/prismaContext";
import { PurchaseOrder, POStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export interface CreatePOParams {
    supplierId: string;
    divisionId?: string;
    expectedDeliveryDate?: Date;
    currency?: string;
    paymentTerms?: string;
    remarks?: string;
    items: {
        productId?: string;
        productName: string;
        sku?: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        remarks?: string;
    }[];
}

@injectable()
export class PurchaseOrderService {
    public async create(params: CreatePOParams): Promise<PurchaseOrder> {
        // Generate PO Number: PO-YYYYMMDD-XXXX (last 4 of timestamp)
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        const poNumber = `PO-${dateStr}-${randomStr}`;

        return prisma.purchaseOrder.create({
            data: {
                poNumber,
                supplierId: params.supplierId,
                divisionId: params.divisionId,
                expectedDeliveryDate: params.expectedDeliveryDate,
                currency: params.currency || "USD",
                paymentTerms: params.paymentTerms,
                remarks: params.remarks,
                status: POStatus.DRAFT,
                items: {
                    create: params.items.map(item => ({
                        productId: item.productId,
                        productName: item.productName,
                        sku: item.sku,
                        quantity: item.quantity,
                        unitPrice: new Decimal(item.unitPrice),
                        totalPrice: new Decimal(item.totalPrice),
                        remarks: item.remarks
                    }))
                }
            },
            include: {
                items: true,
                supplier: true,
                division: true
            }
        });
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

    public async getById(id: string): Promise<PurchaseOrder | null> {
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
                approvals: true
            }
        });
    }

    public async update(id: string, params: Partial<CreatePOParams & { status: POStatus }>): Promise<PurchaseOrder> {
        const { items, ...headerData } = params;

        return prisma.$transaction(async (tx) => {
            // Update header
            const updatedPO = await tx.purchaseOrder.update({
                where: { id },
                data: {
                    supplierId: headerData.supplierId,
                    divisionId: headerData.divisionId,
                    expectedDeliveryDate: headerData.expectedDeliveryDate,
                    currency: headerData.currency,
                    paymentTerms: headerData.paymentTerms,
                    remarks: headerData.remarks,
                    status: headerData.status,
                }
            });

            // If items are provided, replace them (Atomic: Delete then Re-create)
            if (items) {
                await tx.purchaseOrderItem.deleteMany({
                    where: { poId: id }
                });

                await tx.purchaseOrderItem.createMany({
                    data: items.map(item => ({
                        poId: id,
                        productId: item.productId,
                        productName: item.productName,
                        sku: item.sku,
                        quantity: item.quantity,
                        unitPrice: new Decimal(item.unitPrice),
                        totalPrice: new Decimal(item.totalPrice),
                        remarks: item.remarks
                    }))
                });
            }

            return tx.purchaseOrder.findUniqueOrThrow({
                where: { id },
                include: {
                    items: true,
                    supplier: true,
                    division: true
                }
            });
        });
    }

    public async delete(id: string): Promise<void> {
        await prisma.purchaseOrder.update({
            where: { id },
            data: { status: POStatus.DELETED }
        });
    }
}
