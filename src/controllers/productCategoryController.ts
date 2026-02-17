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
import { ProductCategoryService, ProductCategoryCreationParams } from "../services/productCategoryService";
import { ProductCategory } from "@prisma/client";
import { PaginatedResult } from "../types/pagination";

@Route("product-categories")
@Tags("ProductCategory")
@injectable()
export class ProductCategoryController extends Controller {
    constructor(
        @inject(ProductCategoryService) private categoryService: ProductCategoryService
    ) {
        super();
    }

    @Get("paginated")
    public async getCategoriesPaginated(
        @Query() page: number = 1,
        @Query() limit: number = 10,
        @Query() search?: string
    ): Promise<PaginatedResult<ProductCategory>> {
        return this.categoryService.getPaginated(page, limit, search);
    }

    @Get()
    public async getCategories(): Promise<ProductCategory[]> {
        return this.categoryService.getAll();
    }

    @Get("{id}")
    public async getCategory(@Path() id: number): Promise<ProductCategory | null> {
        return this.categoryService.getById(id);
    }

    @SuccessResponse("201", "Created")
    @Post()
    @Security("jwt")
    public async createCategory(
        @Body() requestBody: ProductCategoryCreationParams,
        @Request() request: express.Request
    ): Promise<ProductCategory> {
        this.setStatus(201);
        const user = (request as any).user;
        return this.categoryService.create(requestBody, user?.id, user?.username);
    }

    @Put("{id}")
    @Security("jwt")
    public async updateCategory(
        @Path() id: number,
        @Body() requestBody: Partial<ProductCategoryCreationParams>,
        @Request() request: express.Request
    ): Promise<ProductCategory> {
        const user = (request as any).user;
        return this.categoryService.update(id, requestBody, user?.id, user?.username);
    }

    @SuccessResponse("204", "Deleted")
    @Delete("{id}")
    @Security("jwt")
    public async deleteCategory(
        @Path() id: number,
        @Request() request: express.Request
    ): Promise<void> {
        this.setStatus(204);
        const user = (request as any).user;
        await this.categoryService.delete(id, user?.id, user?.username);
    }
}
