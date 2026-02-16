import { Approval, POStatus } from "@prisma/client";
import { prisma } from "../repositories/prismaContext";
import { injectable } from "inversify";

export interface ApprovalParams {
    poId: number;
    approverId: number;
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
                newStatus = POStatus.REJECTED_L1;
            } else {
                if (params.level === 1) {
                    newStatus = POStatus.APPROVED_L1;
                } else if (params.level === 2) {
                    // CRITICAL: Check inventory before L2 Approval
                    const po = await tx.purchaseOrder.findUnique({
                        where: { id: params.poId },
                        include: { items: true }
                    });

                    if (!po) throw new Error("Purchase Order not found");

                    for (const item of po.items) {
                        if (item.productId) {
                            const inv = await tx.inventory.findUnique({
                                where: { productId: item.productId },
                                include: { product: true }
                            });

                            if (!inv || inv.quantity < item.quantity) {
                                throw new Error(`Insufficient stock for product: ${inv?.product?.name || item.productName}. Required: ${item.quantity}, Available: ${inv?.quantity || 0}`);
                            }
                        }
                    }

                    newStatus = POStatus.ORDER_PLACED;
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
