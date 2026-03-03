import { DispatchStatus, POStatus, Prisma } from "@prisma/client";
import { prisma } from "../repositories/prismaContext";
import { injectable } from "inversify";

export interface DashboardStats {
    totalOrders: number;
    activeOrders: number;
    pendingApproval: number;
    delayedOrders: number;
    totalSuppliers: number;
    totalDivisions: number;
    totalProducts: number;
    totalCategories: number;
    totalDispatches: number;
    activeDispatches: number;
    deliveredDispatches: number;
    statusCounts: Record<string, number>;
    dispatchStatusCounts: Record<string, number>;
}

export interface OrdersByDivision {
    divisionName: string;
    count: number;
    totalQty: number;
    dispatchedQty: number;
    deliveredQty: number;
    pendingQty: number;
}

export interface DelayedOrdersPaginated {
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@injectable()
export class DashboardService {

    private buildDivisionFilter(divisionId?: number): Prisma.PurchaseOrderWhereInput {
        return divisionId ? { divisionId } : {};
    }

    public async getStats(divisionId?: number): Promise<DashboardStats> {
        const now = new Date();
        const divFilter = this.buildDivisionFilter(divisionId);

        const [
            totalOrders,
            activeOrders,
            totalSuppliers,
            totalDivisions,
            totalProducts,
            totalCategories,
            statusCountsRaw,
            totalDispatches,
            activeDispatches,
            deliveredDispatches,
            dispatchStatusCountsRaw,
        ] = await Promise.all([
            prisma.purchaseOrder.count({ where: divFilter }),
            prisma.purchaseOrder.count({
                where: {
                    ...divFilter,
                    status: {
                        notIn: [POStatus.FULLY_DELIVERED, POStatus.CLOSED, POStatus.REJECTED_L1, POStatus.CANCELLED, POStatus.DELETED]
                    }
                }
            }),
            // Suppliers / Divisions / Products / Categories: only for admin (not scoped to division)
            prisma.supplier.count({ where: { status: { not: 'DELETED' } } }),
            prisma.division.count({ where: { status: { not: 'DELETED' } } }),
            prisma.product.count({ where: { status: { not: 'DELETED' } } }),
            prisma.productCategory.count({ where: { status: { not: 'DELETED' } } }),
            prisma.purchaseOrder.groupBy({
                by: ['status'],
                where: divFilter,
                _count: { id: true }
            }),
            // Dispatch counts (scoped by division if needed)
            prisma.dispatch.count({
                where: {
                    status: { notIn: [DispatchStatus.DELETED] },
                    ...(divisionId ? {
                        items: {
                            some: {
                                poItem: { purchaseOrder: { divisionId } }
                            }
                        }
                    } : {})
                }
            }),
            prisma.dispatch.count({
                where: {
                    status: { in: [DispatchStatus.PACKED, DispatchStatus.SHIPPED, DispatchStatus.IN_TRANSIT] },
                    ...(divisionId ? {
                        items: {
                            some: {
                                poItem: { purchaseOrder: { divisionId } }
                            }
                        }
                    } : {})
                }
            }),
            prisma.dispatch.count({
                where: {
                    status: DispatchStatus.DELIVERED,
                    ...(divisionId ? {
                        items: {
                            some: {
                                poItem: { purchaseOrder: { divisionId } }
                            }
                        }
                    } : {})
                }
            }),
            prisma.dispatch.groupBy({
                by: ['status'],
                where: {
                    status: { not: DispatchStatus.DELETED },
                    ...(divisionId ? {
                        items: {
                            some: {
                                poItem: { purchaseOrder: { divisionId } }
                            }
                        }
                    } : {})
                },
                _count: { id: true }
            }),
        ]);

        const statusCounts: Record<string, number> = {};
        statusCountsRaw.forEach(item => { statusCounts[item.status] = item._count.id; });

        const dispatchStatusCounts: Record<string, number> = {};
        dispatchStatusCountsRaw.forEach(item => { dispatchStatusCounts[item.status] = item._count.id; });

        const pendingApproval = (statusCounts[POStatus.PENDING_L1] || 0);

        const delayedOrdersCount = await prisma.purchaseOrder.count({
            where: {
                ...divFilter,
                status: {
                    notIn: [POStatus.FULLY_DELIVERED, POStatus.CLOSED, POStatus.REJECTED_L1, POStatus.CANCELLED, POStatus.DELETED]
                },
                items: { some: { expectedDeliveryDate: { lt: now } } }
            }
        });

        return {
            totalOrders,
            activeOrders,
            pendingApproval,
            delayedOrders: delayedOrdersCount,
            totalSuppliers,
            totalDivisions,
            totalProducts,
            totalCategories,
            totalDispatches,
            activeDispatches,
            deliveredDispatches,
            statusCounts,
            dispatchStatusCounts,
        };
    }

    public async getDelayedOrders(divisionId?: number, page: number = 1, limit: number = 10) {
        const now = new Date();
        const divFilter = this.buildDivisionFilter(divisionId);

        const where: Prisma.PurchaseOrderWhereInput = {
            ...divFilter,
            status: {
                notIn: [POStatus.FULLY_DELIVERED, POStatus.CLOSED, POStatus.REJECTED_L1, POStatus.CANCELLED, POStatus.DELETED]
            },
            items: { some: { expectedDeliveryDate: { lt: now } } }
        };

        const [total, data] = await prisma.$transaction([
            prisma.purchaseOrder.count({ where }),
            prisma.purchaseOrder.findMany({
                where,
                include: { supplier: true, division: true, items: true },
                orderBy: { poDate: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
            })
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    public async getOrdersByDivision(divisionId?: number): Promise<OrdersByDivision[]> {
        const divFilter = this.buildDivisionFilter(divisionId);

        const orders = await prisma.purchaseOrder.findMany({
            where: { ...divFilter, status: { not: POStatus.DELETED } },
            include: {
                division: true,
                items: {
                    include: {
                        dispatchItems: {
                            include: {
                                dispatch: { select: { status: true } }
                            }
                        }
                    }
                }
            }
        });

        const divisionsMap: Record<string, { count: number; totalQty: number; dispatchedQty: number; deliveredQty: number }> = {};

        orders.forEach(o => {
            const divName = o.division?.name || 'Unassigned';
            if (!divisionsMap[divName]) {
                divisionsMap[divName] = { count: 0, totalQty: 0, dispatchedQty: 0, deliveredQty: 0 };
            }
            divisionsMap[divName].count += 1;

            o.items.forEach(item => {
                divisionsMap[divName].totalQty += Number(item.quantity);

                item.dispatchItems.forEach(di => {
                    const st = di.dispatch?.status;
                    // Dispatched = SHIPPED or above (not DRAFT/PACKED)
                    if (st && ['SHIPPED', 'IN_TRANSIT', 'DELIVERED'].includes(st)) {
                        divisionsMap[divName].dispatchedQty += di.quantity;
                    }
                    if (st === DispatchStatus.DELIVERED) {
                        divisionsMap[divName].deliveredQty += di.quantity;
                    }
                });
            });
        });

        return Object.entries(divisionsMap).map(([name, data]) => ({
            divisionName: name,
            count: data.count,
            totalQty: data.totalQty,
            dispatchedQty: data.dispatchedQty,
            deliveredQty: data.deliveredQty,
            pendingQty: data.totalQty - data.deliveredQty,
        }));
    }

    // ── Reports ─────────────────────────────────────────────────────────────

    public async getOrdersReport(params: {
        status?: string;
        divisionId?: number;
        supplierId?: number;
        from?: Date;
        to?: Date;
    }) {
        const where: Prisma.PurchaseOrderWhereInput = {
            status: { not: POStatus.DELETED },
            ...(params.status && { status: params.status as POStatus }),
            ...(params.divisionId && { divisionId: params.divisionId }),
            ...(params.supplierId && { supplierId: params.supplierId }),
            ...(params.from || params.to ? {
                poDate: {
                    ...(params.from && { gte: params.from }),
                    ...(params.to && { lte: params.to }),
                }
            } : {}),
        };

        return prisma.purchaseOrder.findMany({
            where,
            include: {
                supplier: true,
                division: true,
                items: { include: { product: true } },
                approvals: { include: { approver: true } },
            },
            orderBy: { poDate: 'desc' },
        });
    }

    public async getDispatchesReport(params: {
        status?: string;
        supplierId?: number;
        from?: Date;
        to?: Date;
    }) {
        const where: Prisma.DispatchWhereInput = {
            status: { not: DispatchStatus.DELETED },
            ...(params.status && { status: params.status as DispatchStatus }),
            ...(params.supplierId && { supplierId: params.supplierId }),
            ...(params.from || params.to ? {
                createdAt: {
                    ...(params.from && { gte: params.from }),
                    ...(params.to && { lte: params.to }),
                }
            } : {}),
        };

        return prisma.dispatch.findMany({
            where,
            include: {
                supplier: true,
                items: {
                    include: {
                        poItem: {
                            include: {
                                product: true,
                                purchaseOrder: { include: { division: true } },
                            }
                        }
                    }
                },
                stageUpdates: { include: { updatedByUser: true }, orderBy: { timestamp: 'asc' } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
