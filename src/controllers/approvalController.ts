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
import { ApprovalService, ApprovalParams } from "../services/approvalService";
import { Approval } from "@prisma/client";

@Route("approvals")
@Tags("Approvals")
@injectable()
export class ApprovalController extends Controller {
    constructor(
        @inject(ApprovalService) private approvalService: ApprovalService
    ) {
        super();
    }

    @Get("history/{poId}")
    public async getHistory(@Path() poId: number): Promise<Approval[]> {
        return this.approvalService.getHistory(poId);
    }

    @SuccessResponse("201", "Created")
    @Post()
    public async submitApproval(
        @Body() requestBody: ApprovalParams
    ): Promise<Approval> {
        this.setStatus(201);
        return this.approvalService.submitApproval(requestBody);
    }
}
