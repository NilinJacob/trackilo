import { Router } from "express";
import { healthCheckController } from "../controllers/healthcheck.controller.js";

const router = Router();

router.get("/", healthCheckController);

export default router;
