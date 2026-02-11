import { Controller, Get, Route, Tags } from "tsoa";
import { injectable } from "inversify";

@Route("health")
@Tags("Health")
@injectable()
export class HealthController extends Controller {
    @Get("/")
    public async getHealth(): Promise<{ status: string }> {
        return { status: "OK" };
    }
}
