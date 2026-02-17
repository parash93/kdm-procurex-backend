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
    SuccessResponse,
    Tags,
} from "tsoa";
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
    public async createCategory(
        @Body() requestBody: ProductCategoryCreationParams
    ): Promise<ProductCategory> {
        this.setStatus(201);
        return this.categoryService.create(requestBody);
    }

    @Put("{id}")
    public async updateCategory(
        @Path() id: number,
        @Body() requestBody: Partial<ProductCategoryCreationParams>
    ): Promise<ProductCategory> {
        return this.categoryService.update(id, requestBody);
    }

    @SuccessResponse("204", "Deleted")
    @Delete("{id}")
    public async deleteCategory(@Path() id: number): Promise<void> {
        this.setStatus(204);
        await this.categoryService.delete(id);
    }
}
