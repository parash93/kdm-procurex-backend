import {
    Controller,
    Get,
    Post,
    Route,
    Body,
    Path,
    Request,
    Security,
    SuccessResponse,
    Tags,
} from "tsoa";
import * as express from "express";
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
    @Security("jwt")
    public async submitApproval(
        @Body() requestBody: ApprovalParams,
        @Request() request: express.Request
    ): Promise<Approval> {
        this.setStatus(201);
        const user = (request as any).user;
        return this.approvalService.submitApproval(requestBody, user?.id, user?.username);
    }
}
