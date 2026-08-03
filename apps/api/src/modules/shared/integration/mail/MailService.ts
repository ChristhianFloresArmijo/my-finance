import { Injectable, Logger, OnModuleInit } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { MailConfig } from "@config/EnvConfiguration"
import * as nodemailer from "nodemailer"
import type { Transporter } from "nodemailer"

export interface MailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name)
  private transporter: Transporter

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const mail = this.configService.get<MailConfig>("mail")!
    this.transporter = nodemailer.createTransport({
      host: mail.host,
      port: mail.port,
      secure: mail.secure,
      // Mailhog requires no auth; production providers use { user, pass } here
    })
    this.logger.log(`Mail transport ready → ${mail.host}:${mail.port}`)
  }

  async send(options: MailOptions): Promise<void> {
    const from = this.configService.get<MailConfig>("mail")!.from
    try {
      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      })
      this.logger.log(`Email sent to ${options.to} — "${options.subject}"`)
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error)
      throw error
    }
  }

  /** Convenience: send a password-reset email */
  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    await this.send({
      to,
      subject: "Reset your password",
      html: `
        <p>You requested a password reset.</p>
        <p>Click the link below within <strong>1 hour</strong>:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you didn't request this, ignore this email.</p>
      `,
      text: `Reset your password: ${resetUrl}\n\nLink expires in 1 hour.`,
    })
  }

  /** Convenience: send welcome email to admin-created user with their initial credentials */
  async sendWelcomeWithCredentials(
    to: string,
    name: string,
    password: string,
    loginUrl: string,
  ): Promise<void> {
    await this.send({
      to,
      subject: "Your account has been created",
      html: `
        <p>Hi ${name},</p>
        <p>An administrator has created an account for you. Here are your credentials:</p>
        <table style="border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:14px">Email</td><td style="padding:4px 0;font-size:14px"><strong>${to}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:14px">Password</td><td style="padding:4px 0;font-size:14px"><strong>${password}</strong></td></tr>
        </table>
        <p><a href="${loginUrl}" style="display:inline-block;padding:10px 20px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;font-size:14px">Sign in now</a></p>
        <p style="color:#6b7280;font-size:12px">Please change your password after your first login.</p>
      `,
      text: `Hi ${name},\n\nYour account credentials:\nEmail: ${to}\nPassword: ${password}\n\nSign in at: ${loginUrl}\n\nPlease change your password after your first login.`,
    })
  }

  /** Convenience: send an email-verification email */
  async sendEmailVerification(to: string, verifyUrl: string): Promise<void> {
    await this.send({
      to,
      subject: "Verify your email address",
      html: `
        <p>Welcome! Please verify your email address by clicking the link below:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>This link expires in <strong>24 hours</strong>.</p>
      `,
      text: `Verify your email: ${verifyUrl}\n\nLink expires in 24 hours.`,
    })
  }
}
