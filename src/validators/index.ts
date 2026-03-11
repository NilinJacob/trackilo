import { email, z } from "zod";

export const registerValidation = z.object({
  email: z.string().email("Invalid email format"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),

  userName: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must not exceed 20 characters")
    .trim(),
});

export const loginValidation = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const userChangeCurrentPasswordValidator = z.object({
  oldPassword: z.string().min(1, "Password is required"),
  newPassword: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
});

export const userForgotPasswordValidator = z.object({
  email: z.string().email("Invalid email format"),
});

export const userResetForgotPasswordValidator = z.object({
  newPassword: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
});
