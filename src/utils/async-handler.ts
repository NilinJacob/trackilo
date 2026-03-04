import type { NextFunction, Request, RequestHandler, Response } from "express";

// handler used to omit too much try catch

export const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Promise.resolve make every fn passed to return as a promise
