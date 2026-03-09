import { Router } from "express";
import type { Router as RouterType } from "express";
import { loginUser, registerUser } from "../controllers/auth.controllers.js";
import { validate } from "../middlewares/validator.middleware.js";
import { registerValidation } from "../validators/index.js";

const router: RouterType = Router();

router.post("/register", validate(registerValidation), registerUser);

router.post("/login",loginUser)


export default router;
