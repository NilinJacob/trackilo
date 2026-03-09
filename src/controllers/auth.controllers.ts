import type { Request, Response, RequestHandler } from "express";
import ApiResponse from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { User } from "../models/user.models.js";
import { emailVerficationMessage, sendMail } from "../utils/mail.js";

const generateAccessandRefreshToken = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(500, "No user found");
    }

    const accessToken = user?.generateAccessToken();
    const refreshToken = user?.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user?.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(500, "Something went wrong while generating access token");
  }
};

export const registerUser = async (req: Request, res: Response) => {
  const { email, userName, password } = req.body;

  const isUserExists = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (isUserExists) throw new ApiError(409, "User with email or username already exists", []);

  const user = await User.create({
    email,
    password,
    userName,
    isEmailVerified: false,
  });

  const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });

  await sendMail({
    email: user?.email,
    subject: "Please verify your email",
    mailGenContent: emailVerficationMessage(
      user.userName,
      `${req.protocol}:/${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`,
    ),
  });

  if (!user) {
    throw new ApiError(500, "Somthing went wrong while registering a user");
  }

  const safeUser = {
    _id: user._id,
    email: user.email,
    userName: user.userName,
    avatar: user.avatar,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
  };

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        safeUser,
        "User registered successfully and verification email sent to your email",
      ),
    );
};

export const registerUserController: RequestHandler = asyncHandler(registerUser);
