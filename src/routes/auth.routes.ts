import { Router } from "express";
import type { Router as RouterType } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  verifyEmail,
} from "../controllers/auth.controllers.js";
import { validate } from "../middlewares/validator.middleware.js";
import { loginValidation, registerValidation } from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router: RouterType = Router();

router.post("/register", validate(registerValidation), registerUser);
router.post("/login", validate(loginValidation), loginUser);
router.get("/verify-email/:verificationToken", verifyEmail);
router.post("/refresh-token/", refreshAccessToken);

// secure
router.post("/logout", verifyJWT, logoutUser);

export default router;
