import {
    Body,
    Controller,
    Get,
    Path,
    Post,
    Put,
    Query,
    Request,
    Route,
    Security,
    Tags,
    Delete
} from "tsoa";
import { Dispatch, DispatchStatus } from "@prisma/client";
import * as express from "express";
import { inject, injectable } from "inversify";
import { CreateDispatchParams, DispatchService } from "../services/dispatchService";

interface DispatchCreationParams {
    supplierId: number;
    referenceNumber?: string;
    remarks?: string;
    items: {
        poItemId: number;
        quantity: number;
    }[];
}

interface UpdateStatusParams {
    status: DispatchStatus;
    notes?: string;
}

interface PaginatedDispatches {
    data: Dispatch[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Route("dispatches")
@Tags("Dispatches")
@injectable()
export class DispatchController extends Controller {
    constructor(
        @inject(DispatchService) private dispatchService: DispatchService
    ) {
        super();
    }

    /**
     * Create a new dispatch entry
     */
    @Post()
    @Security("jwt", ["OPERATIONS", "ADMIN"])
    public async createDispatch(
        @Body() requestBody: DispatchCreationParams,
        @Request() request: express.Request
    ): Promise<Dispatch> {
        return this.dispatchService.createDispatch(requestBody);
    }

    /**
     * Get paginated dispatches
     */
    @Get()
    @Security("jwt")
    public async getDispatches(
        @Query() page: number = 1,
        @Query() limit: number = 10,
        @Query() search?: string
    ): Promise<PaginatedDispatches> {
        const result = await this.dispatchService.getDispatches(page, limit, search);
        return {
            ...result,
            page,
            limit,
            totalPages: Math.ceil(result.total / limit)
        };
    }

    /**
     * Get dispatch details by ID
     */
    @Get("{id}")
    @Security("jwt")
    public async getDispatchById(@Path() id: number): Promise<Dispatch | null> {
        return this.dispatchService.getDispatchById(id);
    }

    /**
     * Update dispatch status (and add tracking/timeline event)
     */
    @Put("{id}/status")
    @Security("jwt", ["OPERATIONS", "ADMIN"])
    public async updateStatus(
        @Path() id: number,
        @Body() requestBody: UpdateStatusParams,
        @Request() request: express.Request
    ): Promise<Dispatch> {
        const user = (request as any).user;
        return this.dispatchService.updateStatus(id, requestBody.status, user.id, requestBody.notes);
    }
}
