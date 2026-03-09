import Mailgen from "mailgen";
import type { Content } from "mailgen";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport/index.js";

const mailGenerator = new Mailgen({
  theme: "default",
  product: {
    name: "Trackilo",
    link: "https://trackilo.in",
  },
});

interface SendMailOptions {
  email: string;
  subject: string;
  mailGenContent: Content;
}

export const sendMail = async (options: SendMailOptions) => {
  const emailHtml = mailGenerator.generate(options.mailGenContent);
  const emailText = mailGenerator.generatePlaintext(options.mailGenContent);

  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST,
    port: Number(process.env.MAILTRAP_SMTP_PORT),
    auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASS,
    },
  } as SMTPTransport.Options);

  const mail = {
    from: "mail.trackilo@example.com",
    to: options.email,
    subject: options.subject,
    text: emailText,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mail);
  } catch (err) {
    console.error("Email service failed", err);
  }
};

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
