import { Router } from "express";
import type { Router as RouterType } from "express";
import {
    changePassword,
  forgotPassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendEmailVerification,
  resetPassword,
  verifyEmail,
} from "../controllers/auth.controllers.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
  loginValidation,
  registerValidation,
  userChangeCurrentPasswordValidator,
  userForgotPasswordValidator,
  userResetForgotPasswordValidator,
} from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";



const router: RouterType = Router();

router.post("/register", validate(registerValidation), registerUser);
router.post("/login", validate(loginValidation), loginUser);
router.get("/verify-email/:verificationToken", verifyEmail);
router.post("/refresh-token/", refreshAccessToken);
router.post("/forgot-password", validate(userForgotPasswordValidator), forgotPassword);
router.post(
  "/reset-password/:resetToken",
  validate(userResetForgotPasswordValidator),
  resetPassword,
);

// secure
router.post("/logout", verifyJWT, logoutUser);
router.get("/current-user",verifyJWT,getCurrentUser);
router.post("/change-password",verifyJWT,validate(userChangeCurrentPasswordValidator),changePassword)
router.post("/resend-email-verification",verifyJWT,resendEmailVerification)

export default router;
