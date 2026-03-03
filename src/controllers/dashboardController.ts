import {
    Controller,
    Get,
    Query,
    Route,
    Tags,
    Security,
} from "tsoa";
import { inject, injectable } from "inversify";
import { DashboardService, DashboardStats, OrdersByDivision } from "../services/dashboardService";

@Route("dashboard")
@Tags("Dashboard")
@injectable()
export class DashboardController extends Controller {
    constructor(
        @inject(DashboardService) private dashboardService: DashboardService
    ) {
        super();
    }

    @Get("stats")
    public async getStats(@Query() divisionId?: number): Promise<DashboardStats> {
        return this.dashboardService.getStats(divisionId);
    }

    @Get("delayed")
    public async getDelayedOrders(
        @Query() divisionId?: number,
        @Query() page: number = 1,
        @Query() limit: number = 10
    ): Promise<any> {
        return this.dashboardService.getDelayedOrders(divisionId, page, limit);
    }

    @Get("by-division")
    public async getOrdersByDivision(@Query() divisionId?: number): Promise<OrdersByDivision[]> {
        return this.dashboardService.getOrdersByDivision(divisionId);
    }

    @Get("reports/orders")
    public async getOrdersReport(
        @Query() status?: string,
        @Query() divisionId?: number,
        @Query() supplierId?: number,
        @Query() from?: string,
        @Query() to?: string,
    ): Promise<any[]> {
        return this.dashboardService.getOrdersReport({
            status,
            divisionId,
            supplierId,
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
        });
    }

    @Get("reports/dispatches")
    public async getDispatchesReport(
        @Query() status?: string,
        @Query() supplierId?: number,
        @Query() from?: string,
        @Query() to?: string,
    ): Promise<any[]> {
        return this.dashboardService.getDispatchesReport({
            status,
            supplierId,
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
        });
    }
}
