import express from "express";
import type { Express } from "express";
import cors from "cors";

const app: Express = express();

// basic configurations
app.use(
  express.json({
    limit: "16kb",
  }),
);

app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// cors configurations

const origin = process.env.CROSS_ORIGIN?.split(",") || "https://localhost:5173";

app.use(
  cors({
    origin: origin,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  }),
);

// Note: credentials true and origin "*" is a security risk.

export default app;
