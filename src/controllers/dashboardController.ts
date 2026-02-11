import {
    Controller,
    Get,
    Route,
    Tags,
} from "tsoa";
import { inject, injectable } from "inversify";
import { DashboardService, DashboardStats, OrdersByStatus, OrdersByDivision } from "../services/dashboardService";

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
    public async getStats(): Promise<DashboardStats> {
        return this.dashboardService.getStats();
    }

    @Get("delayed")
    public async getDelayedOrders(): Promise<any[]> {
        return this.dashboardService.getDelayedOrders();
    }

    @Get("by-status")
    public async getOrdersByStatus(): Promise<OrdersByStatus[]> {
        return this.dashboardService.getOrdersByStatus();
    }

    @Get("by-division")
    public async getOrdersByDivision(): Promise<OrdersByDivision[]> {
        return this.dashboardService.getOrdersByDivision();
    }
}
