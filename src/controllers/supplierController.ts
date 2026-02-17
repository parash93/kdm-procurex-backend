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
import { SupplierService, SupplierCreationParams } from "../services/supplierService";
import { Supplier } from "@prisma/client";
import { PaginatedResult } from "../types/pagination";

@Route("suppliers")
@Tags("Suppliers")
@injectable()
export class SupplierController extends Controller {
    constructor(
        @inject(SupplierService) private supplierService: SupplierService
    ) {
        super();
    }

    @Get("paginated")
    public async getSuppliersPaginated(
        @Query() page: number = 1,
        @Query() limit: number = 10,
        @Query() search?: string
    ): Promise<PaginatedResult<Supplier>> {
        return this.supplierService.getPaginated(page, limit, search);
    }

    @Get("{id}")
    public async getSupplier(@Path() id: number): Promise<Supplier | null> {
        return this.supplierService.get(id);
    }

    @Get("/")
    public async getAllSuppliers(): Promise<Supplier[]> {
        return this.supplierService.getAll();
    }

    @SuccessResponse("201", "Created")
    @Post()
    @Security("jwt")
    public async createSupplier(
        @Body() requestBody: SupplierCreationParams,
        @Request() request: express.Request
    ): Promise<Supplier> {
        this.setStatus(201);
        const user = (request as any).user;
        return this.supplierService.create(requestBody, user?.id, user?.username);
    }

    @Put("{id}")
    @Security("jwt")
    public async updateSupplier(
        @Path() id: number,
        @Body() requestBody: Partial<SupplierCreationParams>,
        @Request() request: express.Request
    ): Promise<Supplier> {
        const user = (request as any).user;
        return this.supplierService.update(id, requestBody, user?.id, user?.username);
    }

    @SuccessResponse("204", "Deleted")
    @Delete("{id}")
    @Security("jwt")
    public async deleteSupplier(
        @Path() id: number,
        @Request() request: express.Request
    ): Promise<void> {
        const user = (request as any).user;
        await this.supplierService.delete(id, user?.id, user?.username);
        this.setStatus(204);
    }
}
