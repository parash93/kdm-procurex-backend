import express, { Response as ExResponse, Request as ExRequest } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { RegisterRoutes } from "./build/routes";
import swaggerUi from "swagger-ui-express";
import path from "path";

export const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve Swagger UI
app.use("/docs", swaggerUi.serve, async (_req: ExRequest, res: ExResponse) => {
    return res.send(
        swaggerUi.generateHTML(await import("./build/swagger.json"))
    );
});

// Register Tsoa Routes
const router = express.Router();
RegisterRoutes(router);
app.use("/v1", router);

// 404 Handler
app.use(function notFoundHandler(_req, res: ExResponse) {
    res.status(404).send({
        message: "Not Found",
    });
});
