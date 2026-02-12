import { POStatus } from "@prisma/client";
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
    statusCounts: Record<string, number>;
}

export interface OrdersByDivision {
    divisionName: string;
    count: number;
    totalAmount: number;
}

@injectable()
export class DashboardService {
    public async getStats(): Promise<DashboardStats> {
        const now = new Date();

        const [
            totalOrders,
            activeOrders,
            totalSuppliers,
            totalDivisions,
            totalProducts,
            totalCategories,
            statusCountsRaw
        ] = await Promise.all([
            prisma.purchaseOrder.count(),
            prisma.purchaseOrder.count({
                where: {
                    status: {
                        notIn: [POStatus.DELIVERED, POStatus.CLOSED, POStatus.REJECTED_L1, POStatus.CANCELLED]
                    }
                }
            }),
            prisma.supplier.count(),
            prisma.division.count(),
            prisma.product.count(),
            prisma.productCategory.count(),
            prisma.purchaseOrder.groupBy({
                by: ['status'],
                _count: { id: true }
            })
        ]);

        const statusCounts: Record<string, number> = {};
        statusCountsRaw.forEach(item => {
            statusCounts[item.status] = item._count.id;
        });

        const pendingApproval = (statusCounts[POStatus.PENDING_L1] || 0);

        // Delayed check: find orders where at least one item is delayed
        const delayedOrdersCount = await prisma.purchaseOrder.count({
            where: {
                status: {
                    notIn: [POStatus.DELIVERED, POStatus.CLOSED, POStatus.REJECTED_L1, POStatus.DRAFT, POStatus.CANCELLED]
                },
                items: {
                    some: {
                        expectedDeliveryDate: {
                            lt: now
                        }
                    }
                }
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
            statusCounts
        };
    }

    public async getDelayedOrders() {
        const now = new Date();
        return prisma.purchaseOrder.findMany({
            where: {
                status: {
                    notIn: [POStatus.DELIVERED, POStatus.CLOSED, POStatus.REJECTED_L1, POStatus.DRAFT, POStatus.CANCELLED]
                },
                items: {
                    some: {
                        expectedDeliveryDate: {
                            lt: now
                        }
                    }
                }
            },
            include: {
                supplier: true,
                division: true,
                items: true
            }
        });
    }

    public async getOrdersByDivision(): Promise<OrdersByDivision[]> {
        const orders = await prisma.purchaseOrder.findMany({
            include: {
                division: true,
                items: true
            }
        });

        const divisionsMap: Record<string, { count: number, total: number }> = {};

        orders.forEach(o => {
            const divName = o.division?.name || 'Unassigned';
            const total = o.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);

            if (!divisionsMap[divName]) {
                divisionsMap[divName] = { count: 0, total: 0 };
            }
            divisionsMap[divName].count += 1;
            divisionsMap[divName].total += total;
        });

        return Object.entries(divisionsMap).map(([name, data]) => ({
            divisionName: name,
            count: data.count,
            totalAmount: data.total
        }));
    }
}
