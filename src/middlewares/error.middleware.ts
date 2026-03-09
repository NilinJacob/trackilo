import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/api-error.js";

export const errorMiddleware = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: err.success,
      message: err.message,
      errors: err.errors ?? [],
      data: err.data ?? null
    });
  }

  // fallback for unknown errors
  console.error(err);

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    errors: [],
    data: null
  });
};