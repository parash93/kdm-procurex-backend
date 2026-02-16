import { injectable } from "inversify";
import { prisma } from "../repositories/prismaContext";
import { PurchaseOrder, POStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export interface CreatePOParams {
    supplierId: number;
    divisionId?: number;
    remarks?: string;
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
    public async create(params: CreatePOParams): Promise<PurchaseOrder> {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        const poNumber = `PO-${dateStr}-${randomStr}`;

        return prisma.purchaseOrder.create({
            data: {
                poNumber,
                supplierId: params.supplierId,
                divisionId: params.divisionId,
                remarks: params.remarks,
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

    public async update(id: number, params: Partial<CreatePOParams & { status: POStatus, updatedByUsername?: number }>): Promise<PurchaseOrder> {
        const { items, updatedByUsername, ...headerData } = params;

        return prisma.$transaction(async (tx) => {
            const currentPO = await tx.purchaseOrder.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!currentPO) throw new Error("PO not found");

            // // Handle Inventory Subtraction if status marked as DELIVERED
            // if (headerData.status === POStatus.DELIVERED && currentPO.status !== POStatus.DELIVERED) {
            //     for (const item of currentPO.items) {
            //         if (item.productId) {
            //             const inv = await tx.inventory.findUnique({ where: { productId: item.productId } });
            //             if (inv) {
            //                 await tx.inventory.update({
            //                     where: { id: inv.id },
            //                     data: { quantity: { decrement: item.quantity } }
            //                 });
            //                 await tx.inventoryHistory.create({
            //                     data: {
            //                         inventoryId: inv.id,
            //                         type: 'SUBTRACT',
            //                         quantity: item.quantity,
            //                         reason: `PO Delivered: ${currentPO.poNumber}`,
            //                         updatedBy: updatedByUsername || 0
            //                     }
            //                 });
            //             }
            //         }
            //     }
            // }

            // // Handle Inventory Addition if status marked as RETURNED (reversing delivery)
            // if (headerData.status === POStatus.RETURNED && currentPO.status === POStatus.DELIVERED) {
            //     for (const item of currentPO.items) {
            //         if (item.productId) {
            //             const inv = await tx.inventory.findUnique({ where: { productId: item.productId } });
            //             if (inv) {
            //                 await tx.inventory.update({
            //                     where: { id: inv.id },
            //                     data: { quantity: { increment: item.quantity } }
            //                 });
            //                 await tx.inventoryHistory.create({
            //                     data: {
            //                         inventoryId: inv.id,
            //                         type: 'ADD',
            //                         quantity: item.quantity,
            //                         reason: `PO Returned: ${currentPO.poNumber}`,
            //                         updatedBy: updatedByUsername || 0
            //                     }
            //                 });
            //             }
            //         }
            //     }
            // }

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

    public async delete(id: number): Promise<void> {
        await prisma.purchaseOrder.update({
            where: { id },
            data: { status: POStatus.DELETED }
        });
    }
}
