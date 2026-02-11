import { Route, Post, Body, Controller, Tags, Get, Security, Delete, Path } from "tsoa";
import { injectable } from "inversify";
import { AuthService, LoginParams, AuthResponse, RegisterParams } from "../services/authService";
import { UserService } from "../services/userService";
import { User } from "@prisma/client";

@injectable()
@Route("auth")
@Tags("Authentication")
export class AuthController extends Controller {
    constructor(
        private authService: AuthService,
        private userService: UserService
    ) {
        super();
    }

    @Post("login")
    public async login(@Body() body: LoginParams): Promise<AuthResponse> {
        return this.authService.login(body);
    }

    @Post("register")
    @Security("jwt", ["ADMIN"])
    public async register(@Body() body: RegisterParams): Promise<User> {
        return this.authService.register(body);
    }

    @Get("users")
    @Security("jwt", ["ADMIN"])
    public async getUsers(): Promise<User[]> {
        return this.userService.getAll();
    }

    @Delete("users/{id}")
    @Security("jwt", ["ADMIN"])
    public async deleteUser(@Path() id: string): Promise<any> {
        return this.userService.delete(id);
    }
}
