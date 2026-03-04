import type { Request, Response } from "express";
import ApiResponse from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

const healthCheck = async (req: Request, res: Response) => {
  res.status(200).json(new ApiResponse(200, null, "Server is running"));
};

export const healthCheckController = asyncHandler(healthCheck);
