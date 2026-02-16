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
import { DivisionService, DivisionCreationParams } from "../services/divisionService";
import { Division } from "@prisma/client";

@Route("divisions")
@Tags("Division")
@injectable()
export class DivisionController extends Controller {
    constructor(
        @inject(DivisionService) private divisionService: DivisionService
    ) {
        super();
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
        this.setStatus(210); // Using 201 via decorator might be cleaner but tsoa handle setStatus
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
