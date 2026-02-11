import {
    Controller,
    Get,
    Post,
    Delete,
    Route,
    Body,
    Path,
    SuccessResponse,
    Tags,
} from "tsoa";
import { inject, injectable } from "inversify";
import { UserService, UserCreationParams } from "../services/userService";
import { User } from "@prisma/client";

@Route("users")
@Tags("Users")
@injectable()
export class UserController extends Controller {
    constructor(
        @inject(UserService) private userService: UserService
    ) {
        super();
    }

    @Get()
    public async getUsers(): Promise<User[]> {
        return this.userService.getAll();
    }

    @SuccessResponse("201", "Created")
    @Post()
    public async createUser(
        @Body() requestBody: UserCreationParams
    ): Promise<User> {
        this.setStatus(201);
        return this.userService.create(requestBody);
    }

    @SuccessResponse("200", "Seeded")
    @Post("seed")
    public async seedUsers(): Promise<{ message: string }> {
        await this.userService.seedInitialUsers();
        return { message: "Users seeded successfully" };
    }

    @SuccessResponse("204", "Deleted")
    @Delete("{id}")
    public async deleteUser(@Path() id: string): Promise<void> {
        this.setStatus(204);
        await this.userService.delete(id);
    }
}
