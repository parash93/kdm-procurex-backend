import {
    Controller,
    Get,
    Post,
    Route,
    Body,
    Path,
    SuccessResponse,
    Tags,
    Security,
    Request
} from "tsoa";
import * as express from "express";
import { inject, injectable } from "inversify";
import { TrackingService, StageUpdateParams } from "../services/trackingService";
import { StageUpdate } from "@prisma/client";

@Route("tracking")
@Tags("Tracking")
@injectable()
export class TrackingController extends Controller {
    constructor(
        @inject(TrackingService) private trackingService: TrackingService
    ) {
        super();
    }

    @Get("{poId}")
    public async getHistory(@Path() poId: string): Promise<StageUpdate[]> {
        return this.trackingService.getHistory(poId);
    }

    @SuccessResponse("201", "Created")
    @Post()
    @Security("jwt")
    public async addUpdate(
        @Body() requestBody: StageUpdateParams,
        @Request() request: express.Request
    ): Promise<StageUpdate> {
        this.setStatus(201);
        const user = (request as any).user;
        return this.trackingService.addStageUpdate({
            ...requestBody,
            updatedBy: user?.id
        });
    }
}
