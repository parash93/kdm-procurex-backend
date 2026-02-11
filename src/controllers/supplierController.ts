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
import { SupplierService, SupplierCreationParams } from "../services/supplierService";
import { Supplier } from "@prisma/client";

@Route("suppliers")
@Tags("Suppliers")
@injectable()
export class SupplierController extends Controller {
    constructor(
        @inject(SupplierService) private supplierService: SupplierService
    ) {
        super();
    }

    @Get("{id}")
    public async getSupplier(@Path() id: string): Promise<Supplier | null> {
        return this.supplierService.get(id);
    }

    @Get("/")
    public async getAllSuppliers(): Promise<Supplier[]> {
        return this.supplierService.getAll();
    }

    @SuccessResponse("201", "Created")
    @Post()
    public async createSupplier(
        @Body() requestBody: SupplierCreationParams
    ): Promise<Supplier> {
        this.setStatus(201);
        return this.supplierService.create(requestBody);
    }

    @Put("{id}")
    public async updateSupplier(
        @Path() id: string,
        @Body() requestBody: Partial<SupplierCreationParams>
    ): Promise<Supplier> {
        return this.supplierService.update(id, requestBody);
    }

    @SuccessResponse("204", "Deleted")
    @Delete("{id}")
    public async deleteSupplier(@Path() id: string): Promise<void> {
        await this.supplierService.delete(id);
        this.setStatus(204);
    }
}
