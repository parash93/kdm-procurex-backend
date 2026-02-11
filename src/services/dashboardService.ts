import { POStatus } from "@prisma/client";
import { prisma } from "../repositories/prismaContext";
import { injectable } from "inversify";

export interface DashboardStats {
    totalOrders: number;
    activeOrders: number;
    pendingApprovals: number;
    delayedOrders: number;
    totalSuppliers: number;
    totalDivisions: number;
    totalProducts: number;
    totalCategories: number;
}

export interface OrdersByStatus {
    status: POStatus;
    count: number;
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
            pendingApprovals,
            delayedOrders,
            totalSuppliers,
            totalDivisions,
            totalProducts,
            totalCategories
        ] = await Promise.all([
            prisma.purchaseOrder.count(),
            prisma.purchaseOrder.count({
                where: {
                    status: {
                        notIn: [POStatus.DELIVERED, POStatus.CLOSED, POStatus.REJECTED]
                    }
                }
            }),
            prisma.purchaseOrder.count({
                where: { status: POStatus.PENDING_APPROVAL }
            }),
            prisma.purchaseOrder.count({
                where: {
                    status: {
                        notIn: [POStatus.DELIVERED, POStatus.CLOSED, POStatus.REJECTED, POStatus.DRAFT]
                    },
                    expectedDeliveryDate: {
                        lt: now
                    }
                }
            }),
            prisma.supplier.count(),
            prisma.division.count(),
            prisma.product.count(),
            prisma.productCategory.count()
        ]);

        return {
            totalOrders,
            activeOrders,
            pendingApprovals,
            delayedOrders,
            totalSuppliers,
            totalDivisions,
            totalProducts,
            totalCategories
        };
    }

    public async getDelayedOrders() {
        const now = new Date();
        return prisma.purchaseOrder.findMany({
            where: {
                status: {
                    notIn: [POStatus.DELIVERED, POStatus.CLOSED, POStatus.REJECTED, POStatus.DRAFT]
                },
                expectedDeliveryDate: {
                    lt: now
                }
            },
            include: {
                supplier: true,
                division: true
            }
        });
    }

    public async getOrdersByStatus(): Promise<OrdersByStatus[]> {
        const grouped = await prisma.purchaseOrder.groupBy({
            by: ['status'],
            _count: {
                id: true
            }
        });

        return grouped.map(g => ({
            status: g.status,
            count: g._count.id
        }));
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
