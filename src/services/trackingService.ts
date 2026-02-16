import { StageUpdate, POStatus } from "@prisma/client";
import { prisma } from "../repositories/prismaContext";
import { injectable } from "inversify";

export interface StageUpdateParams {
    poId: number;
    stage: string;
    notes?: string;
    photoUrl?: string;
    updatedBy?: number;
    updatePOStatus?: boolean;
}

@injectable()
export class TrackingService {
    public async addStageUpdate(params: StageUpdateParams): Promise<StageUpdate> {
        return prisma.$transaction(async (tx) => {
            const update = await tx.stageUpdate.create({
                data: {
                    poId: params.poId,
                    stage: params.stage,
                    notes: params.notes,
                    photoUrl: params.photoUrl,
                    updatedBy: params.updatedBy
                }
            });

            // Optionally sync PO status if stage matches an enum value
            if (params.updatePOStatus) {
                const statusValue = params.stage.toUpperCase().replace(/\s+/g, '_') as POStatus;
                if (Object.values(POStatus).includes(statusValue)) {
                    // Get current PO to check status transition
                    const currentPO = await tx.purchaseOrder.findUnique({
                        where: { id: params.poId },
                        include: { items: true }
                    });

                    if (!currentPO) throw new Error("Purchase Order not found");

                    // // Handle Inventory Subtraction if status changing to DELIVERED
                    // if (statusValue === POStatus.DELIVERED && currentPO.status !== POStatus.DELIVERED) {
                    //     for (const item of currentPO.items) {
                    //         if (item.productId) {
                    //             const inv = await tx.inventory.findUnique({
                    //                 where: { productId: item.productId }
                    //             });
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
                    //                         updatedBy: params.updatedBy || 0
                    //                     }
                    //                 });
                    //             }
                    //         }
                    //     }
                    // }

                    // // Handle Inventory Addition if status changing to RETURNED from DELIVERED
                    // if (statusValue === POStatus.RETURNED && currentPO.status === POStatus.DELIVERED) {
                    //     for (const item of currentPO.items) {
                    //         if (item.productId) {
                    //             const inv = await tx.inventory.findUnique({
                    //                 where: { productId: item.productId }
                    //             });
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
                    //                         updatedBy: params.updatedBy || 0
                    //                     }
                    //                 });
                    //             }
                    //         }
                    //     }
                    // }

                    // Update PO status
                    await tx.purchaseOrder.update({
                        where: { id: params.poId },
                        data: { status: statusValue }
                    });
                }
            }

            return update;
        }, {
            timeout: 15000 // 15 seconds to handle inventory updates
        });
    }

    public async getHistory(poId: number): Promise<StageUpdate[]> {
        return prisma.stageUpdate.findMany({
            where: { poId },
            include: {
                updatedByUser: true
            },
            orderBy: {
                timestamp: 'desc'
            }
        });
    }
}
