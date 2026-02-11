import * as express from "express";
import { iocContainer } from "../ioc/ioc";
import { AuthService } from "../services/authService";

export async function expressAuthentication(
    request: express.Request,
    securityName: string,
    scopes?: string[]
): Promise<any> {
    if (securityName === "jwt") {
        const token = request.headers["authorization"]?.split(" ")[1];

        if (!token) {
            return Promise.reject(new Error("No token provided"));
        }

        const authService = iocContainer.get<AuthService>(AuthService);
        const decoded = await authService.verifyToken(token);

        if (!decoded) {
            return Promise.reject(new Error("Invalid token"));
        }

        // Check scopes (roles)
        if (scopes && scopes.length > 0) {
            const userRole = decoded.role;
            if (!scopes.includes(userRole)) {
                return Promise.reject(new Error("Insufficient permissions"));
            }
        }

        return Promise.resolve(decoded);
    }
}
