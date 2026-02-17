import { StageUpdate, POStatus } from "@prisma/client";
import { prisma } from "../repositories/prismaContext";
import { injectable, inject } from "inversify";
import { AuditService } from "./auditService";

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
    constructor(@inject(AuditService) private auditService: AuditService) { }

    public async addStageUpdate(params: StageUpdateParams, userId?: number, username?: string): Promise<StageUpdate> {
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

            let previousStatus: string | undefined;
            let newStatus: string | undefined;

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

                    previousStatus = currentPO.status;
                    newStatus = statusValue;

                    // Update PO status
                    await tx.purchaseOrder.update({
                        where: { id: params.poId },
                        data: { status: statusValue }
                    });
                }
            }

            // Get PO number for metadata
            const po = await tx.purchaseOrder.findUnique({ where: { id: params.poId } });

            // Audit log for stage update
            this.auditService.log({
                entityType: "ORDER",
                entityId: params.poId,
                action: "STAGE_UPDATE",
                userId: userId || params.updatedBy,
                username,
                newData: update,
                metadata: {
                    poNumber: po?.poNumber,
                    stage: params.stage,
                    notes: params.notes,
                    previousStatus,
                    newStatus,
                    statusUpdated: !!params.updatePOStatus,
                },
            });

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
