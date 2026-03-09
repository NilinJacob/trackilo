import { Router } from "express";
import type { Router as RouterType } from "express";
import { registerUserController } from "../controllers/auth.controllers.js";
import { validate } from "../middlewares/validator.middleware.js";
import { registerValidation } from "../validators/index.js";

const router: RouterType = Router();

router.post("/register", validate(registerValidation), registerUserController);

export default router;
