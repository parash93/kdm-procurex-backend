import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Route,
    Body,
    Path,
    SuccessResponse,
    Tags,
} from "tsoa";
import { inject, injectable } from "inversify";
import { ProductService, ProductCreationParams } from "../services/productService";
import { Product } from "@prisma/client";

@Route("products")
@Tags("Product")
@injectable()
export class ProductController extends Controller {
    constructor(
        @inject(ProductService) private productService: ProductService
    ) {
        super();
    }

    @Get()
    public async getProducts(): Promise<Product[]> {
        return this.productService.getAll();
    }

    @Get("{id}")
    public async getProduct(@Path() id: string): Promise<Product | null> {
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
        @Path() id: string,
        @Body() requestBody: Partial<ProductCreationParams>
    ): Promise<Product> {
        return this.productService.update(id, requestBody);
    }

    @SuccessResponse("204", "Deleted")
    @Delete("{id}")
    public async deleteProduct(@Path() id: string): Promise<void> {
        this.setStatus(204);
        await this.productService.delete(id);
    }
}
