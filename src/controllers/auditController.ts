import {
    Controller,
    Get,
    Query,
    Path,
    Route,
    Tags,
    Security,
} from "tsoa";
import { inject, injectable } from "inversify";
import { AuditService, AuditLogResponse } from "../services/auditService";
import { PaginatedResult } from "../types/pagination";

@Route("audit")
@Tags("Audit Logs")
@injectable()
export class AuditController extends Controller {
    constructor(
        @inject(AuditService) private auditService: AuditService
    ) {
        super();
    }

    /**
     * Get paginated audit logs (admin only)
     */
    @Get("paginated")
    @Security("jwt", ["ADMIN"])
    public async getAuditLogs(
        @Query() page: number = 1,
        @Query() limit: number = 20,
        @Query() search?: string,
        @Query() entityType?: string,
        @Query() action?: string,
        @Query() entityId?: number
    ): Promise<PaginatedResult<AuditLogResponse>> {
        return this.auditService.getPaginated(page, limit, search, entityType, action, entityId);
    }

    /**
     * Get audit history for a specific entity
     */
    @Get("{entityType}/{entityId}")
    @Security("jwt", ["ADMIN"])
    public async getEntityHistory(
        @Path() entityType: string,
        @Path() entityId: number
    ): Promise<AuditLogResponse[]> {
        return this.auditService.getEntityHistory(entityType, entityId);
    }
}
