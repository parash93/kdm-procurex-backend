import { Approval, POStatus } from "@prisma/client";
import { prisma } from "../repositories/prismaContext";
import { injectable } from "inversify";

export interface ApprovalParams {
    poId: string;
    approverId: string;
    level: number;
    decision: "APPROVED" | "REJECTED";
    remarks?: string;
}

@injectable()
export class ApprovalService {
    public async submitApproval(params: ApprovalParams): Promise<Approval> {
        return prisma.$transaction(async (tx) => {
            // Create Approval Record
            const approval = await tx.approval.create({
                data: {
                    poId: params.poId,
                    approverId: params.approverId,
                    level: params.level,
                    decision: params.decision,
                    remarks: params.remarks
                }
            });

            // Determine PO status transition
            let newStatus: POStatus | undefined;

            if (params.decision === "REJECTED") {
                newStatus = POStatus.REJECTED;
            } else {
                // If Level 1 is approved, we stay in PENDING_APPROVAL but wait for Level 2
                // If Level 2 is approved, we move to APPROVED
                if (params.level === 1) {
                    newStatus = POStatus.PENDING_APPROVAL; // Or a more specific status if added
                } else if (params.level === 2) {
                    newStatus = POStatus.APPROVED;
                }
            }

            if (newStatus) {
                await tx.purchaseOrder.update({
                    where: { id: params.poId },
                    data: { status: newStatus }
                });
            }

            return approval;
        });
    }

    public async getHistory(poId: string): Promise<Approval[]> {
        return prisma.approval.findMany({
            where: { poId },
            include: {
                approver: true
            },
            orderBy: {
                timestamp: 'asc'
            }
        });
    }
}
