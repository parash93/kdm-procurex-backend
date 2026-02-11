import {
    Body,
    Controller,
    Get,
    Path,
    Post,
    Route,
    SuccessResponse,
    Tags,
} from "tsoa";
import { inject, injectable } from "inversify";
import { PurchaseOrderService, CreatePOParams } from "../services/poService";
import { PurchaseOrder } from "@prisma/client";

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
    public async getOrder(@Path() id: string): Promise<PurchaseOrder | null> {
        return this.poService.getnodes(id);
    }

    @SuccessResponse("201", "Created")
    @Post()
    public async createOrder(
        @Body() requestBody: CreatePOParams
    ): Promise<PurchaseOrder> {
        this.setStatus(201);
        return this.poService.create(requestBody);
    }
}
