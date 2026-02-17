import {
    Body,
    Controller,
    Get,
    Path,
    Post,
    Route,
    Request,
    Security,
    SuccessResponse,
    Tags,
    Query,
} from "tsoa";
import * as express from "express";
import { inject, injectable } from "inversify";
import { InventoryService } from "../services/inventoryService";

interface UpdateStockParams {
    productId: number;
    quantity: number;
    type: 'ADD' | 'SUBTRACT';
    reason: string;
    updatedBy: number;
}

@Route("inventory")
@Tags("Inventory")
@injectable()
export class InventoryController extends Controller {
    constructor(
        @inject(InventoryService) private inventoryService: InventoryService
    ) {
        super();
    }

    @Get("/")
    public async getInventory() {
        return this.inventoryService.getAll();
    }

    @Get("history/{productId}")
    public async getHistory(@Path() productId: number) {
        return this.inventoryService.getHistory(productId);
    }

    @Post("update")
    @SuccessResponse("200", "Updated")
    @Security("jwt")
    public async updateStock(
        @Body() requestBody: UpdateStockParams,
        @Request() request: express.Request
    ) {
        const user = (request as any).user;
        return this.inventoryService.updateStock(
            requestBody.productId,
            requestBody.quantity,
            requestBody.type,
            requestBody.reason,
            requestBody.updatedBy,
            user?.username
        );
    }
}
