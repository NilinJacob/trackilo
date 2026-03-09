import { Router } from "express";
import type { Router as RouterType } from "express";
import { registerUserController } from "../controllers/auth.controllers.js";

const router: RouterType = Router();

router.post("/register", registerUserController);

export default router;
