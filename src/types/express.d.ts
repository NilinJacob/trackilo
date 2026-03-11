import type { IUser } from "./allTypes.ts";

declare global {
  namespace Express {
    interface Request {
        user?: UserDocument;
    }
  }
}

export {};