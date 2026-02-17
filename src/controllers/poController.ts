import {
    Body,
    Controller,
    Delete,
    Get,
    Path,
    Post,
    Put,
    Query,
    Request,
    Route,
    Security,
    SuccessResponse,
    Tags,
} from "tsoa";
import * as express from "express";
import { inject, injectable } from "inversify";
import { PurchaseOrderService, CreatePOParams } from "../services/poService";
import { PurchaseOrder, POStatus } from "@prisma/client";
import { PaginatedResult } from "../types/pagination";

@Route("orders")
@Tags("Purchase Orders")
@injectable()
export class PurchaseOrderController extends Controller {
    constructor(
        @inject(PurchaseOrderService) private poService: PurchaseOrderService
    ) {
        super();
    }

    @Get("paginated")
    public async getOrdersPaginated(
        @Query() page: number = 1,
        @Query() limit: number = 10,
        @Query() search?: string,
        @Query() status?: string
    ): Promise<PaginatedResult<PurchaseOrder>> {
        return this.poService.getPaginated(page, limit, search, status);
    }

    @Get("/")
    public async getAllOrders(): Promise<PurchaseOrder[]> {
        return this.poService.getAll();
    }

    @Get("{id}")
    public async getOrder(@Path() id: number): Promise<PurchaseOrder | null> {
        return this.poService.getById(id);
    }

    @SuccessResponse("201", "Created")
    @Post()
    @Security("jwt")
    public async createOrder(
        @Body() requestBody: CreatePOParams,
        @Request() request: express.Request
    ): Promise<PurchaseOrder> {
        this.setStatus(201);
        const user = (request as any).user;
        return this.poService.create(requestBody, user?.id, user?.username);
    }

    @Put("{id}")
    @Security("jwt")
    public async updateOrder(
        @Path() id: number,
        @Body() requestBody: Partial<CreatePOParams & { status: POStatus }>,
        @Request() request: express.Request
    ): Promise<PurchaseOrder> {
        const user = (request as any).user;
        return this.poService.update(id, requestBody, user?.id, user?.username);
    }

    @SuccessResponse("204", "Deleted")
    @Delete("{id}")
    @Security("jwt")
    public async deleteOrder(
        @Path() id: number,
        @Request() request: express.Request
    ): Promise<void> {
        const user = (request as any).user;
        await this.poService.delete(id, user?.id, user?.username);
        this.setStatus(204);
    }
}
