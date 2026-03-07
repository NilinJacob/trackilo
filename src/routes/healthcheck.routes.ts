import { Router } from "express";
import type { Router as RouterType } from "express";
import { healthCheckController } from "../controllers/healthcheck.controllers.js";

const router: RouterType = Router();

router.get("/", healthCheckController);

export default router;
