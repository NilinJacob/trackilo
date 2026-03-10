import type { Request, Response, RequestHandler, NextFunction } from "express";
import ApiResponse from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { User } from "../models/user.models.js";
import { emailVerficationMessage, sendMail } from "../utils/mail.js";
import type { Types } from "mongoose";

const generateAccessandRefreshToken = async (
  userId: Types.ObjectId,
): Promise<{ accessToken: string; refreshToken: string }> => {
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

export const registerUser: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
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
    throw new ApiError(500, "Something went wrong while registering a user");
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
        201,
        safeUser,
        "User registered successfully and verification email sent to your email",
      ),
    );
});

export const loginUser: RequestHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "Email and password is required");
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      throw new ApiError(401, "User Not Found");
    }

    const isPasswordCorrect = await user?.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
      throw new ApiError(401, "Invalid Credentials");
    }

    const safeUser = {
      _id: user._id,
      email: user.email,
      userName: user.userName,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    };

    const { accessToken, refreshToken } = await generateAccessandRefreshToken(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { data: safeUser, accessToken, refreshToken },
          "User logged in successfully",
        ),
      );
  },
);

export const logoutUser: RequestHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { _id } = req.user!;
    await User.findByIdAndUpdate(
      _id,
      {
        $set: {
          refreshToken: "",
        },
      },
      {
        returnDocument: "after",
      },
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged out"));
  },
);
