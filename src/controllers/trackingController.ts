import {
    Controller,
    Get,
    Post,
    Route,
    Body,
    Path,
    SuccessResponse,
    Tags,
} from "tsoa";
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
    public async addUpdate(
        @Body() requestBody: StageUpdateParams
    ): Promise<StageUpdate> {
        this.setStatus(201);
        return this.trackingService.addStageUpdate(requestBody);
    }
}
