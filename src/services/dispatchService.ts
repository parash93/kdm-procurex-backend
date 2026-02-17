import { Prisma, Dispatch, DispatchStatus, POStatus } from "@prisma/client";
import { prisma } from "../repositories/prismaContext";
import { injectable } from "inversify";

export interface CreateDispatchItemParams {
    poItemId: number;
    quantity: number;
}

export interface CreateDispatchParams {
    supplierId: number;
    referenceNumber?: string;
    remarks?: string;
    items: CreateDispatchItemParams[];
}

@injectable()
export class DispatchService {

    public async createDispatch(params: CreateDispatchParams): Promise<Dispatch> {
        // Validation: Check if items belong to supplier
        // Check if quantities are valid (<= remaining PO quantity)

        // Transaction to create Dispatch and Items
        return prisma.$transaction(async (tx) => {
            // 1. Validate Items and POs
            for (const item of params.items) {
                const poItem = await tx.purchaseOrderItem.findUnique({
                    where: { id: item.poItemId },
                    include: { purchaseOrder: true }
                });

                if (!poItem) {
                    throw new Error(`PO Item not found: ${item.poItemId}`);
                }

                if (poItem.purchaseOrder.supplierId !== params.supplierId) {
                    throw new Error(`PO Item ${item.poItemId} does not belong to supplier ${params.supplierId}`);
                }

                // Calculate remaining quantity
                // We need to sum up all EXISTING dispatch items for this poItem
                // Exclude CANCELLED and RETURNED dispatches from this count
                const dispatchedSum = await tx.dispatchItem.aggregate({
                    where: {
                        poItemId: item.poItemId,
                        dispatch: {
                            status: {
                                notIn: [DispatchStatus.CANCELLED, DispatchStatus.RETURNED]
                            }
                        }
                    },
                    _sum: { quantity: true }
                });

                const currentDispatched = dispatchedSum._sum.quantity || 0;

                if (currentDispatched + item.quantity > poItem.quantity) {
                    throw new Error(`Dispatch quantity ${item.quantity} exceeds remaining quantity for Item ${poItem.productName || 'unknown'} (PO: ${poItem.purchaseOrder.poNumber}). Remaining: ${poItem.quantity - currentDispatched}`);
                }
            }

            // 2. Create Dispatch Header
            const dispatch = await tx.dispatch.create({
                data: {
                    supplierId: params.supplierId,
                    referenceNumber: params.referenceNumber,
                    remarks: params.remarks,
                    status: DispatchStatus.DRAFT,
                    items: {
                        create: params.items.map(i => ({
                            poItemId: i.poItemId,
                            quantity: i.quantity
                        }))
                    }
                },
                include: {
                    items: {
                        include: { poItem: true }
                    }
                }
            });

            // 3. Update DispatchedQuantity cache on POItem (optional, for performance)
            // I added dispatchedQuantity to schema, let's update it.
            for (const item of params.items) {
                await tx.purchaseOrderItem.update({
                    where: { id: item.poItemId },
                    data: {
                        dispatchedQuantity: { increment: item.quantity }
                    }
                });
            }

            // 4. Update PO Status?
            // "PO should display status and quantity dispatched... based on dispatches"
            // We can update PO status to PARTIALLY_DELIVERED if needed, 
            // but usually this happens when Dispatch is DELIVERED, not Created.
            // But if we track "Dispatched", creation implies "In Progress".
            // Let's leave PO Status update for when Dispatch Status changes to DELIVERED.

            return dispatch;
        });
    }

    public async getDispatches(page: number, limit: number, search?: string): Promise<{ data: Dispatch[], total: number }> {
        const where: Prisma.DispatchWhereInput = {
            ...(search && {
                OR: [
                    { referenceNumber: { contains: search, mode: 'insensitive' } },
                    { supplier: { companyName: { contains: search, mode: 'insensitive' } } },
                    { items: { some: { poItem: { purchaseOrder: { poNumber: { contains: search, mode: 'insensitive' } } } } } }
                ]
            })
        };

        const [total, data] = await prisma.$transaction([
            prisma.dispatch.count({ where }),
            prisma.dispatch.findMany({
                where,
                include: {
                    supplier: true,
                    items: {
                        include: {
                            poItem: {
                                include: { purchaseOrder: true }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            })
        ]);

        return { data, total };
    }

    public async getDispatchById(id: number): Promise<Dispatch | null> {
        return prisma.dispatch.findUnique({
            where: { id },
            include: {
                supplier: true,
                items: {
                    include: {
                        poItem: {
                            include: {
                                product: true,
                                purchaseOrder: true
                            }
                        }
                    }
                },
                stageUpdates: {
                    orderBy: { timestamp: 'desc' },
                    include: { updatedByUser: true }
                }
            }
        });
    }

    public async updateStatus(
        id: number,
        status: DispatchStatus,
        userId: number,
        notes?: string
    ): Promise<Dispatch> {
        return prisma.$transaction(async (tx) => {

            const dispatch = await tx.dispatch.findUniqueOrThrow({
                where: { id },
                include: { items: { include: { poItem: true } } }
            });

            const previousStatus = dispatch.status;
            const newStatus = status;

            // Prevent invalid transitions
            if (previousStatus === DispatchStatus.CANCELLED) {
                throw new Error("Cannot change status from CANCELLED");
            }

            const wasDelivered = previousStatus === DispatchStatus.DELIVERED;
            const isDelivered = newStatus === DispatchStatus.DELIVERED;
            const isReturned = newStatus === DispatchStatus.RETURNED;
            const isCancelled = newStatus === DispatchStatus.CANCELLED;

            // Update dispatch status
            const updated = await tx.dispatch.update({
                where: { id },
                data: { status: newStatus },
                include: { items: { include: { poItem: true } } }
            });

            // Create timeline entry
            await tx.stageUpdate.create({
                data: {
                    dispatchId: id,
                    stage: newStatus,
                    notes,
                    updatedBy: userId
                }
            });

            // 1. DISPATCHED QUANTITY LOGIC (PO Tracking)
            // Note: dispatchedQuantity is incremented during createDispatch (DRAFT)
            // We only need to handle REVERSALS here.

            // EXITING any active state to Returned/Cancelled → decrement dispatchedQuantity
            if (isReturned || isCancelled) {
                if (previousStatus !== DispatchStatus.RETURNED) { // Don't reverse twice if already returned
                    for (const item of dispatch.items) {
                        await tx.purchaseOrderItem.update({
                            where: { id: item.poItemId },
                            data: {
                                dispatchedQuantity: { decrement: item.quantity }
                            }
                        });
                    }
                }
            }

            /* =====================================================
               2️⃣ INVENTORY LOGIC (Physical Stock)
               ===================================================== */

            // Add stock when entering Delivered
            if (!wasDelivered && isDelivered) {
                for (const item of dispatch.items) {
                    if (item.poItem?.productId) {

                        const inv = await tx.inventory.upsert({
                            where: { productId: item.poItem.productId },
                            update: {
                                quantity: { increment: item.quantity }
                            },
                            create: {
                                productId: item.poItem.productId,
                                quantity: item.quantity
                            }
                        });

                        await tx.inventoryHistory.create({
                            data: {
                                inventoryId: inv.id,
                                type: 'ADD',
                                quantity: item.quantity,
                                reason: `Dispatch Delivered: ${dispatch.referenceNumber || dispatch.id}`,
                                updatedBy: userId
                            }
                        });
                    }
                }
            }

            // Remove stock when leaving Delivered
            if (wasDelivered && (isReturned || isCancelled)) {
                for (const item of dispatch.items) {
                    if (item.poItem?.productId) {

                        const inv = await tx.inventory.update({
                            where: { productId: item.poItem.productId },
                            data: {
                                quantity: { decrement: item.quantity }
                            }
                        });

                        await tx.inventoryHistory.create({
                            data: {
                                inventoryId: inv.id,
                                type: 'SUBTRACT',
                                quantity: item.quantity,
                                reason: `Dispatch ${newStatus}: ${dispatch.referenceNumber || dispatch.id}`,
                                updatedBy: userId
                            }
                        });
                    }
                }
            }

            /* =====================================================
               3️⃣ UPDATE PURCHASE ORDER STATUS
               ===================================================== */

            const poIds = [
                ...new Set(dispatch.items.map(i => i.poItem.poId))
            ];

            for (const poId of poIds) {

                const poItems = await tx.purchaseOrderItem.findMany({
                    where: { poId }
                });

                let allDelivered = true;
                let anyDelivered = false;

                for (const pi of poItems) {

                    const deliveredSum = await tx.dispatchItem.aggregate({
                        where: {
                            poItemId: pi.id,
                            dispatch: { status: DispatchStatus.DELIVERED }
                        },
                        _sum: { quantity: true }
                    });

                    const deliveredQty = deliveredSum._sum.quantity || 0;

                    if (deliveredQty > 0) anyDelivered = true;
                    if (deliveredQty < pi.quantity) allDelivered = false;
                }

                let newPOStatus: POStatus = POStatus.ORDER_PLACED;

                if (allDelivered) {
                    newPOStatus = POStatus.FULLY_DELIVERED;
                } else if (anyDelivered) {
                    newPOStatus = POStatus.PARTIALLY_DELIVERED;
                }

                await tx.purchaseOrder.update({
                    where: { id: poId },
                    data: { status: newPOStatus }
                });
            }

            return updated;
        });
    }

}
