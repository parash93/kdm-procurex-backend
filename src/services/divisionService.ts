import { Division, EntityStatus } from "@prisma/client";
import { prisma } from "../repositories/prismaContext";
import { injectable } from "inversify";

export interface DivisionCreationParams {
    name: string;
    contactPerson?: string;
    status?: EntityStatus;
}

@injectable()
export class DivisionService {
    public async getAll(): Promise<Division[]> {
        return prisma.division.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }

    public async getById(id: string): Promise<Division | null> {
        return prisma.division.findUnique({
            where: { id }
        });
    }

    public async create(params: DivisionCreationParams): Promise<Division> {
        return prisma.division.create({
            data: {
                ...params,
                status: params.status || EntityStatus.ACTIVE
            }
        });
    }

    public async update(id: string, params: Partial<DivisionCreationParams>): Promise<Division> {
        return prisma.division.update({
            where: { id },
            data: params
        });
    }

    public async delete(id: string): Promise<Division> {
        const usageCount = await prisma.purchaseOrder.count({
            where: { divisionId: id }
        });

        if (usageCount > 0) {
            throw new Error(`Cannot delete division as it is linked to ${usageCount} purchase orders.`);
        }

        return prisma.division.delete({
            where: { id }
        });
    }
}
