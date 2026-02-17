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
import { DivisionService, DivisionCreationParams } from "../services/divisionService";
import { Division } from "@prisma/client";
import { PaginatedResult } from "../types/pagination";

@Route("divisions")
@Tags("Division")
@injectable()
export class DivisionController extends Controller {
    constructor(
        @inject(DivisionService) private divisionService: DivisionService
    ) {
        super();
    }

    @Get("paginated")
    public async getDivisionsPaginated(
        @Query() page: number = 1,
        @Query() limit: number = 10,
        @Query() search?: string
    ): Promise<PaginatedResult<Division>> {
        return this.divisionService.getPaginated(page, limit, search);
    }

    @Get()
    public async getDivisions(): Promise<Division[]> {
        return this.divisionService.getAll();
    }

    @Get("{id}")
    public async getDivision(@Path() id: number): Promise<Division | null> {
        return this.divisionService.getById(id);
    }

    @SuccessResponse("201", "Created")
    @Post()
    public async createDivision(
        @Body() requestBody: DivisionCreationParams
    ): Promise<Division> {
        this.setStatus(201);
        return this.divisionService.create(requestBody);
    }

    @Put("{id}")
    public async updateDivision(
        @Path() id: number,
        @Body() requestBody: Partial<DivisionCreationParams>
    ): Promise<Division> {
        return this.divisionService.update(id, requestBody);
    }

    @SuccessResponse("204", "Deleted")
    @Delete("{id}")
    public async deleteDivision(@Path() id: number): Promise<void> {
        this.setStatus(204);
        await this.divisionService.delete(id);
    }
}
