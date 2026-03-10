import { Model } from "mongoose";
import type { Types } from "mongoose";

export interface IUser {
  _id: Types.ObjectId;
  avatar: {
    url?: string | null;
    localPath?: string | null;
  };
  userName: string;
  email: string;
  fullName?: string | null;
  password: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpiry?: Date | null;
  refreshToken?: string | null;
  forgotPasswordToken?: string | null;
  forgotPasswordExpiry?: Date | null;
  createdAt: Date;
}

export interface IUserMethods {
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  generateTemporaryToken(): {
    unHashedToken: string;
    hashedToken: string;
    tokenExpiry: Date;
  };
}

export type UserModel = Model<IUser, {}, IUserMethods>;
