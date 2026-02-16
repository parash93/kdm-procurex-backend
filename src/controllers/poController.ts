import {
    Body,
    Controller,
    Delete,
    Get,
    Path,
    Post,
    Put,
    Route,
    SuccessResponse,
    Tags,
} from "tsoa";
import { inject, injectable } from "inversify";
import { PurchaseOrderService, CreatePOParams } from "../services/poService";
import { PurchaseOrder, POStatus } from "@prisma/client";

@Route("orders")
@Tags("Purchase Orders")
@injectable()
export class PurchaseOrderController extends Controller {
    constructor(
        @inject(PurchaseOrderService) private poService: PurchaseOrderService
    ) {
        super();
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
    public async createOrder(
        @Body() requestBody: CreatePOParams
    ): Promise<PurchaseOrder> {
        this.setStatus(201);
        return this.poService.create(requestBody);
    }

    @Put("{id}")
    public async updateOrder(
        @Path() id: number,
        @Body() requestBody: Partial<CreatePOParams & { status: POStatus }>
    ): Promise<PurchaseOrder> {
        return this.poService.update(id, requestBody);
    }

    @SuccessResponse("204", "Deleted")
    @Delete("{id}")
    public async deleteOrder(@Path() id: number): Promise<void> {
        await this.poService.delete(id);
        this.setStatus(204);
    }
}
