import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { ApiError } from "../utils/api-error.js";

export const validate =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const extractedErrors: Record<string, string>[] = [];

      result.error.issues.forEach((err) => {
        extractedErrors.push({
          [err.path.join(".")]: err.message,
        });
      });

      console.log(extractedErrors);

      throw new ApiError(400, "Validation failed", extractedErrors);
    }

    req.body = result.data;
    next();
  };
