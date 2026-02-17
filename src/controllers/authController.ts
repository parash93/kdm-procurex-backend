import { Route, Post, Body, Controller, Tags, Get, Security, Delete, Path, Request } from "tsoa";
import * as express from "express";
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
    public async register(
        @Body() body: RegisterParams,
        @Request() request: express.Request
    ): Promise<User> {
        const user = (request as any).user;
        return this.authService.register(body);
    }

    @Get("users")
    @Security("jwt", ["ADMIN"])
    public async getUsers(): Promise<User[]> {
        return this.userService.getAll();
    }

    @Delete("users/{id}")
    @Security("jwt", ["ADMIN"])
    public async deleteUser(
        @Path() id: number,
        @Request() request: express.Request
    ): Promise<any> {
        const user = (request as any).user;
        return this.userService.delete(id, user?.id, user?.username);
    }
}
