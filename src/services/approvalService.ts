import { Approval, POStatus } from "@prisma/client";
import { prisma } from "../repositories/prismaContext";
import { injectable, inject } from "inversify";
import { AuditService } from "./auditService";

export interface ApprovalParams {
    poId: number;
    approverId: number;
    level: number;
    decision: "APPROVED" | "REJECTED";
    remarks?: string;
}

@injectable()
export class ApprovalService {
    constructor(@inject(AuditService) private auditService: AuditService) { }

    public async submitApproval(params: ApprovalParams, userId?: number, username?: string): Promise<Approval> {
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

            const previousPO = await tx.purchaseOrder.findUnique({
                where: { id: params.poId }
            });

            // Determine PO status transition
            let newStatus: POStatus | undefined;

            if (params.decision === "REJECTED") {
                newStatus = POStatus.REJECTED_L1;
            } else {
                if (params.level === 1) {
                    newStatus = POStatus.APPROVED_L1;
                } else if (params.level === 2) {
                    const po = await tx.purchaseOrder.findUnique({
                        where: { id: params.poId },
                        include: { items: true }
                    });

                    if (!po) throw new Error("Purchase Order not found");

                    newStatus = POStatus.ORDER_PLACED;
                }
            }

            if (newStatus) {
                await tx.purchaseOrder.update({
                    where: { id: params.poId },
                    data: { status: newStatus }
                });
            }

            // Audit log for approval/rejection
            this.auditService.log({
                entityType: "ORDER",
                entityId: params.poId,
                action: params.decision === "APPROVED" ? "APPROVE" : "REJECT",
                userId: userId || params.approverId,
                username,
                previousData: previousPO,
                newData: { ...approval, newStatus },
                metadata: {
                    poNumber: previousPO?.poNumber,
                    level: params.level,
                    decision: params.decision,
                    remarks: params.remarks,
                    previousStatus: previousPO?.status,
                    newStatus: newStatus || previousPO?.status,
                },
            });

            return approval;
        });
    }

    public async getHistory(poId: number): Promise<Approval[]> {
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
