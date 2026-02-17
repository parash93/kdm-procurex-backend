import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Route,
    Body,
    Path,
    Query,
    Request,
    Security,
    SuccessResponse,
    Tags,
} from "tsoa";
import * as express from "express";
import { inject, injectable } from "inversify";
import { ProductService, ProductCreationParams } from "../services/productService";
import { Product } from "@prisma/client";
import { PaginatedResult } from "../types/pagination";

@Route("products")
@Tags("Product")
@injectable()
export class ProductController extends Controller {
    constructor(
        @inject(ProductService) private productService: ProductService
    ) {
        super();
    }

    @Get("paginated")
    public async getProductsPaginated(
        @Query() page: number = 1,
        @Query() limit: number = 10,
        @Query() search?: string
    ): Promise<PaginatedResult<Product>> {
        return this.productService.getPaginated(page, limit, search);
    }

    @Get()
    public async getProducts(): Promise<Product[]> {
        return this.productService.getAll();
    }

    @Get("{id}")
    public async getProduct(@Path() id: number): Promise<Product | null> {
        return this.productService.getById(id);
    }

    @SuccessResponse("201", "Created")
    @Post()
    @Security("jwt")
    public async createProduct(
        @Body() requestBody: ProductCreationParams,
        @Request() request: express.Request
    ): Promise<Product> {
        this.setStatus(201);
        const user = (request as any).user;
        return this.productService.create(requestBody, user?.id, user?.username);
    }

    @Put("{id}")
    @Security("jwt")
    public async updateProduct(
        @Path() id: number,
        @Body() requestBody: Partial<ProductCreationParams>,
        @Request() request: express.Request
    ): Promise<Product> {
        const user = (request as any).user;
        return this.productService.update(id, requestBody, user?.id, user?.username);
    }

    @SuccessResponse("204", "Deleted")
    @Delete("{id}")
    @Security("jwt")
    public async deleteProduct(
        @Path() id: number,
        @Request() request: express.Request
    ): Promise<void> {
        this.setStatus(204);
        const user = (request as any).user;
        await this.productService.delete(id, user?.id, user?.username);
    }
}
