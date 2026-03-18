import express from "express";
import type { Express } from "express";
import cors from "cors";
import cookieParser from 'cookie-parser'
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

const app: Express = express();

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// basic configurations
app.use(
  express.json({
    limit: "16kb",
  }),
);

app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser())


// cors configurations

const origin = process.env.CROSS_ORIGIN?.split(",") || "http://localhost:3000";

console.log(origin);


app.use(
  cors({
    origin: origin,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  }),
);

// Note: credentials true and origin "*" is a security risk.

// import Routes
import healthCheckRouter from "./routes/healthcheck.routes.js";
import authRouter from "./routes/auth.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

app.use("/api/v1/healthCheck", healthCheckRouter);
app.use("/api/v1/auth", authRouter);



app.use(errorMiddleware);
export default app;
