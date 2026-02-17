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
    public async createProduct(
        @Body() requestBody: ProductCreationParams
    ): Promise<Product> {
        this.setStatus(201);
        return this.productService.create(requestBody);
    }

    @Put("{id}")
    public async updateProduct(
        @Path() id: number,
        @Body() requestBody: Partial<ProductCreationParams>
    ): Promise<Product> {
        return this.productService.update(id, requestBody);
    }

    @SuccessResponse("204", "Deleted")
    @Delete("{id}")
    public async deleteProduct(@Path() id: number): Promise<void> {
        this.setStatus(204);
        await this.productService.delete(id);
    }
}
