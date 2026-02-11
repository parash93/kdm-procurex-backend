import { StageUpdate, POStatus } from "@prisma/client";
import { prisma } from "../repositories/prismaContext";
import { injectable } from "inversify";

export interface StageUpdateParams {
    poId: string;
    stage: string;
    notes?: string;
    photoUrl?: string;
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
                    photoUrl: params.photoUrl
                }
            });

            // Optionally sync PO status if stage matches an enum value
            if (params.updatePOStatus) {
                const statusValue = params.stage.toUpperCase().replace(/\s+/g, '_') as POStatus;
                if (Object.values(POStatus).includes(statusValue)) {
                    await tx.purchaseOrder.update({
                        where: { id: params.poId },
                        data: { status: statusValue }
                    });
                }
            }

            return update;
        });
    }

    public async getHistory(poId: string): Promise<StageUpdate[]> {
        return prisma.stageUpdate.findMany({
            where: { poId },
            orderBy: {
                timestamp: 'desc'
            }
        });
    }
}
