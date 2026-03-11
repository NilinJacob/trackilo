import type { Request, Response, RequestHandler, NextFunction } from "express";
import ApiResponse from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { User } from "../models/user.models.js";
import { emailVerficationMessage, forgotPasswordMessage, sendMail } from "../utils/mail.js";
import type { Types } from "mongoose";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { DecodedTokenProps } from "../types/allTypes.js";

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

export const getCurrentUser: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;

  return res.status(200).json(new ApiResponse(200, user, "Current user fetched successfully"));
});

export const verifyEmail: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const { verificationToken } = req.params as { verificationToken: string };

  if (!verificationToken) {
    throw new ApiError(400, "Email verification token missing");
  }

  // hash every token saved in db
  let hashedToken = crypto.createHash("sha256").update(verificationToken).digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: {
      $gt: Date.now(),
    },
  });

  if (!user) {
    throw new ApiError(400, "Token is invalid or expired");
  }

  user.emailVerificationToken = null;
  user.emailVerificationExpiry = null;

  user.isEmailVerified = true;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, "Email verified successfully"));
});

export const resendEmailVerification: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user!;

    if (user.isEmailVerified) {
      throw new ApiError(400, "Email already verified");
    }

    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;

    await user.save({ validateBeforeSave: false });

    await sendMail({
      email: user.email,
      subject: "Please verify your email",
      mailGenContent: emailVerficationMessage(
        user.userName,
        `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`,
      ),
    });

    return res.status(200).json(new ApiResponse(200, {}, "Verification email sent"));
  },
);

export const refreshAccessToken: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "unauthorized accesss");
    }

    try {
      const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET!,
      ) as DecodedTokenProps;

      const user = await User.findById(decodedToken._id).select("+refreshToken");

      if (!user) {
        throw new ApiError(401, "Invalid refresh token");
      }

      if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh token expired");
      }

      const options = { httOnly: true, secure: true };

      const { accessToken, refreshToken: newRefreshToken } = await generateAccessandRefreshToken(
        user._id,
      );

      user.refreshToken = newRefreshToken;

      await user.save({ validateBeforeSave: false });

      return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
          new ApiResponse(
            200,
            { accessToken, refreshToken: newRefreshToken },
            "Access token refreshed",
          ),
        );
    } catch (error) {
      throw new ApiError(401, "Invalid refresh token");
    }
  },
);

export const forgotPassword: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne(email);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const { hashedToken, unHashedToken, tokenExpiry } = user.generateTemporaryToken();

  user.forgotPasswordToken = hashedToken;
  user.forgotPasswordExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });

  await sendMail({
    email: user?.email,
    subject: "Please verify your email",
    mailGenContent: forgotPasswordMessage(
      user.userName,
      `${req.protocol}:/${req.get("host")}/forgot-password/${unHashedToken}`,
    ),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset mail has been sent to you email"));
});

export const resetPassword: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const { resetToken } = req.params as { resetToken: string };
  const { newPassword } = req.body;

  let hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(489, "Token is invalid or expired");
  }

  user.forgotPasswordExpiry = null;
  user.forgotPasswordToken = null;

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });
  return res.status(200).json(new ApiResponse(200, {}, "Paasword resetted successfully"));
});

export const changePassword: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;

  const user = req.user!;

  const isPasswordValid = await user?.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid old Password");
  }

  user.password = newPassword;
  await user.save();
  return res.status(200).json(new ApiResponse(200, {}, "Pasword change successfully"));
});
