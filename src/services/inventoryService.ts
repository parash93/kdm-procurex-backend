import { prisma } from "../repositories/prismaContext";
import { injectable } from "inversify";
import { Inventory, InventoryHistory } from "@prisma/client";

@injectable()
export class InventoryService {
    public async getAll() {
        return prisma.inventory.findMany({
            include: {
                product: {
                    include: {
                        category: true
                    }
                }
            }
        });
    }

    public async getHistory(productId: string): Promise<InventoryHistory[]> {
        const inventory = await prisma.inventory.findUnique({
            where: { productId }
        });

        if (!inventory) return [];

        return prisma.inventoryHistory.findMany({
            where: { inventoryId: inventory.id },
            include: {
                updatedByUser: true
            },
            orderBy: { timestamp: 'desc' }
        });
    }

    public async updateStock(productId: string, quantity: number, type: 'ADD' | 'SUBTRACT', reason: string, updatedBy: string) {
        return prisma.$transaction(async (tx) => {
            let inventory = await tx.inventory.findUnique({
                where: { productId }
            });

            if (!inventory) {
                inventory = await tx.inventory.create({
                    data: {
                        productId,
                        quantity: 0
                    }
                });
            }

            const newQuantity = type === 'ADD'
                ? inventory.quantity + quantity
                : inventory.quantity - quantity;

            const updatedInventory = await tx.inventory.update({
                where: { id: inventory.id },
                data: { quantity: newQuantity }
            });

            await tx.inventoryHistory.create({
                data: {
                    inventoryId: inventory.id,
                    type,
                    quantity,
                    reason,
                    updatedBy
                }
            });

            return updatedInventory;
        });
    }
}
