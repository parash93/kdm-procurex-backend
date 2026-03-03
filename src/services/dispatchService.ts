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
        // Validation: Check if items belong to supplier (via product.supplierId)
        // Check if quantities are valid (<= remaining PO quantity)

        // Transaction to create Dispatch and Items
        return prisma.$transaction(async (tx) => {
            // 1. Validate Items and POs
            for (const item of params.items) {
                const poItem = await tx.purchaseOrderItem.findUnique({
                    where: { id: item.poItemId },
                    include: {
                        purchaseOrder: true,
                        product: true
                    }
                });

                if (!poItem) {
                    throw new Error(`PO Item not found: ${item.poItemId}`);
                }

                // Validate against product's supplier, not PO's root supplier
                const itemSupplierId = poItem.product?.supplierId;
                if (itemSupplierId && itemSupplierId !== params.supplierId) {
                    throw new Error(`PO Item ${item.poItemId} product belongs to a different supplier`);
                }
                // fallback: if product has no supplier set, check PO root supplier
                if (!itemSupplierId && poItem.purchaseOrder.supplierId !== params.supplierId) {
                    throw new Error(`PO Item ${item.poItemId} does not belong to supplier ${params.supplierId}`);
                }

                // Calculate remaining quantity
                // Exclude CANCELLED and RETURNED dispatches from this count
                const dispatchedSum = await tx.dispatchItem.aggregate({
                    where: {
                        poItemId: item.poItemId,
                        dispatch: {
                            status: {
                                notIn: [
                                    DispatchStatus.CANCELLED,
                                    DispatchStatus.RETURNED,
                                    DispatchStatus.DELETED
                                ]
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

    public async getDispatches(page: number, limit: number, search?: string, divisionId?: number): Promise<{ data: Dispatch[], total: number }> {
        const where: Prisma.DispatchWhereInput = {
            NOT: { status: DispatchStatus.DELETED },
            ...(divisionId && {
                items: {
                    some: {
                        poItem: {
                            purchaseOrder: { divisionId }
                        }
                    }
                }
            }),
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

    /**
     * Get open PO items for a given supplier based on the product's supplierId.
     * Returns items from POs that have remaining (undispatched) quantity.
     */
    public async getOpenPoItemsBySupplier(supplierId: number): Promise<any[]> {
        const poItems = await prisma.purchaseOrderItem.findMany({
            where: {
                product: { supplierId },
                purchaseOrder: {
                    status: {
                        in: [
                            POStatus.ORDER_PLACED,
                            POStatus.PARTIALLY_DELIVERED,
                            POStatus.APPROVED_L1,
                        ]
                    }
                }
            },
            include: {
                product: { include: { supplier: true } },
                purchaseOrder: true
            }
        });

        // Calculate remaining quantity for each item
        const result: any[] = [];
        for (const item of poItems) {
            const dispatchedSum = await prisma.dispatchItem.aggregate({
                where: {
                    poItemId: item.id,
                    dispatch: {
                        status: {
                            notIn: [
                                DispatchStatus.CANCELLED,
                                DispatchStatus.RETURNED,
                                DispatchStatus.DELETED
                            ]
                        }
                    }
                },
                _sum: { quantity: true }
            });
            const remaining = item.quantity - (dispatchedSum._sum.quantity || 0);
            if (remaining > 0) {
                const itemWithPO = item as typeof item & { purchaseOrder: { poNumber: string } };
                result.push({
                    ...item,
                    poNumber: itemWithPO.purchaseOrder?.poNumber,
                    max: remaining,
                    poItemId: item.id
                });
            }
        }
        return result;
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

            // ── Enforce linear status progression ──────────────────────────────
            // Allowed forward transitions:
            //   DRAFT → PACKED → SHIPPED → IN_TRANSIT → DELIVERED → RETURNED
            // CANCELLED is always allowed (except from CANCELLED itself).
            // RETURNED is only allowed from DELIVERED.
            const ORDER: DispatchStatus[] = [
                DispatchStatus.DRAFT,
                DispatchStatus.PACKED,
                DispatchStatus.SHIPPED,
                DispatchStatus.IN_TRANSIT,
                DispatchStatus.DELIVERED,
                DispatchStatus.RETURNED,
            ];

            if (previousStatus === DispatchStatus.CANCELLED) {
                throw new Error("Cannot change status from CANCELLED");
            }
            if (previousStatus === DispatchStatus.RETURNED && newStatus !== DispatchStatus.CANCELLED) {
                throw new Error("Cannot change status from RETURNED (except to CANCELLED)");
            }

            if (newStatus !== DispatchStatus.CANCELLED) {
                const prevIdx = ORDER.indexOf(previousStatus);
                const newIdx = ORDER.indexOf(newStatus);
                if (newIdx !== prevIdx + 1) {
                    throw new Error(
                        `Invalid transition: ${previousStatus} → ${newStatus}. ` +
                        `Expected next status: ${ORDER[prevIdx + 1] ?? 'none'}`
                    );
                }
            }
            // ──────────────────────────────────────────────────────────────────

            const wasDelivered = previousStatus === DispatchStatus.DELIVERED;
            const isShipped = newStatus === DispatchStatus.SHIPPED;
            const isInTransit = newStatus === DispatchStatus.IN_TRANSIT;
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
               A PO can have many items, each dispatched independently,
               so SHIPPED / IN_TRANSIT at the dispatch level has no
               meaningful aggregate representation at the PO level.
               We only update PO status based on how much has actually
               been DELIVERED vs ordered:
                 - Some qty delivered, but not all  → PARTIALLY_DELIVERED
                 - All qty delivered                → FULLY_DELIVERED
                 - Nothing delivered (e.g. after RETURNED/CANCELLED reset) → ORDER_PLACED
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
                    // Sum quantity from DELIVERED dispatches only
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

                let newPOStatus: POStatus;

                if (allDelivered) {
                    newPOStatus = POStatus.FULLY_DELIVERED;
                } else if (anyDelivered) {
                    newPOStatus = POStatus.PARTIALLY_DELIVERED;
                } else {
                    newPOStatus = POStatus.ORDER_PLACED;
                }

                await tx.purchaseOrder.update({
                    where: { id: poId },
                    data: { status: newPOStatus }
                });
            }

            return updated;
        });
    }

    public async softDelete(id: number, userId?: number): Promise<Dispatch> {
        return prisma.$transaction(async (tx) => {
            // Fetch dispatch with items so we can reverse quantities
            const dispatch = await tx.dispatch.findUniqueOrThrow({
                where: { id },
                include: { items: { include: { poItem: true } } }
            });

            if (dispatch.status === DispatchStatus.DELETED) {
                throw new Error('Dispatch is already deleted');
            }

            const wasDelivered = dispatch.status === DispatchStatus.DELIVERED;

            // 1. Mark dispatch as DELETED
            const updated = await tx.dispatch.update({
                where: { id },
                data: { status: DispatchStatus.DELETED }
            });

            // 2. Reverse dispatchedQuantity on each PO item
            //    (only reverse if not already returned/cancelled — those were already decremented)
            const alreadyReversed =
                dispatch.status === DispatchStatus.RETURNED ||
                dispatch.status === DispatchStatus.CANCELLED;

            if (!alreadyReversed) {
                for (const item of dispatch.items) {
                    await tx.purchaseOrderItem.update({
                        where: { id: item.poItemId },
                        data: { dispatchedQuantity: { decrement: item.quantity } }
                    });
                }
            }

            // 3. If dispatch was DELIVERED, reverse inventory additions
            if (wasDelivered) {
                for (const item of dispatch.items) {
                    if (item.poItem?.productId) {
                        const inv = await tx.inventory.update({
                            where: { productId: item.poItem.productId },
                            data: { quantity: { decrement: item.quantity } }
                        });
                        await tx.inventoryHistory.create({
                            data: {
                                inventoryId: inv.id,
                                type: 'SUBTRACT',
                                quantity: item.quantity,
                                reason: `Dispatch #${id} deleted (was DELIVERED)`,
                                updatedBy: userId
                            }
                        });
                    }
                }
            }

            // 4. Recalculate PO status for all affected POs (same logic as updateStatus)
            const poIds = [...new Set(dispatch.items.map(i => i.poItem.poId))];

            for (const poId of poIds) {
                const poItems = await tx.purchaseOrderItem.findMany({ where: { poId } });

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
