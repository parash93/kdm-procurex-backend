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
    @Security("jwt")
    public async createDivision(
        @Body() requestBody: DivisionCreationParams,
        @Request() request: express.Request
    ): Promise<Division> {
        this.setStatus(201);
        const user = (request as any).user;
        return this.divisionService.create(requestBody, user?.id, user?.username);
    }

    @Put("{id}")
    @Security("jwt")
    public async updateDivision(
        @Path() id: number,
        @Body() requestBody: Partial<DivisionCreationParams>,
        @Request() request: express.Request
    ): Promise<Division> {
        const user = (request as any).user;
        return this.divisionService.update(id, requestBody, user?.id, user?.username);
    }

    @SuccessResponse("204", "Deleted")
    @Delete("{id}")
    @Security("jwt")
    public async deleteDivision(
        @Path() id: number,
        @Request() request: express.Request
    ): Promise<void> {
        this.setStatus(204);
        const user = (request as any).user;
        await this.divisionService.delete(id, user?.id, user?.username);
    }
}
