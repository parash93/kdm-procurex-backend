import { Route, Post, Body, Controller, Tags, Get, Security, Delete, Path, Request, Header } from "tsoa";
import * as express from "express";
import { injectable } from "inversify";
import { AuthService, LoginParams, AuthResponse, RefreshResponse, RegisterParams } from "../services/authService";
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

    /**
     * Silently refreshes a still-valid JWT, extending the session by 3 days.
     * Call this proactively (e.g. when token has < 25% lifetime left).
     * Returns 401 if the token is already expired.
     */
    @Post("refresh")
    @Security("jwt")
    public async refresh(
        @Request() request: express.Request
    ): Promise<RefreshResponse> {
        const token = (request as any).headers?.authorization?.split(' ')[1];
        const result = await this.authService.refreshToken(token);
        if (!result) {
            this.setStatus(401);
            throw new Error('Token is expired or invalid');
        }
        return result;
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
