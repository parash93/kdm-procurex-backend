import { injectable } from "inversify";
import { prisma } from "../repositories/prismaContext";
import { PurchaseOrder, POStatus } from "@prisma/client";

export interface CreatePOParams {
    supplierId: string;
    expectedDeliveryDate?: Date;
    currency?: string;
    paymentTerms?: string;
    remarks?: string;
    items: {
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
        const poNumber = `PO-${Date.now()}`; // Simple auto-generation logic

        return prisma.purchaseOrder.create({
            data: {
                poNumber,
                supplierId: params.supplierId,
                expectedDeliveryDate: params.expectedDeliveryDate,
                currency: params.currency || "USD",
                paymentTerms: params.paymentTerms,
                remarks: params.remarks,
                status: POStatus.DRAFT,
                items: {
                    create: params.items.map(item => ({
                        productName: item.productName,
                        sku: item.sku,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice,
                        remarks: item.remarks
                    }))
                }
            },
            include: {
                items: true,
                supplier: true
            }
        });
    }

    public async getAll(): Promise<PurchaseOrder[]> {
        return prisma.purchaseOrder.findMany({
            include: {
                supplier: true,
                items: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    public async getnodes(id: string): Promise<PurchaseOrder | null> {
        return prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                supplier: true,
                items: true,
                stageUpdates: true,
                approvals: true
            }
        });
    }
}
