export const emailVerficationMessage = (userName: string, verificationUrl: string) => {
  return {
    body: {
      name: userName,
      intro: "Welcome to Trackilo! We're excited to have you on board.",
      action: {
        instructions: "Please confirm your email address to activate your account.",
        button: {
          color: "#22BC66",
          text: "Verify Email",
          link: verificationUrl,
        },
      },
      outro: "If you didn’t create this account, you can safely ignore this email.",
    },
  };
};

export const forgotPasswordMessage = (userName: string, passwordResetUrl: string) => {
  return {
    body: {
      name: userName,
      intro: "We received a request to reset your Trackilo account password.",
      action: {
        instructions: "Click the button below to reset your password.",
        button: {
          color: "#E74C3C",
          text: "Reset Password",
          link: passwordResetUrl,
        },
      },
      outro:
        "If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.",
    },
  };
};
