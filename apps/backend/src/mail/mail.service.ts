import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { env } from '@/config/env';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendConfirmationEmail(email: string, token: string) {
    // Construct the link using your validated FRONTEND_URL envar
    const url = `${env.FRONTEND_URL}/auth/confirm?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to GRIT! Confirm your Email',
      html: `
        <h1>Welcome!</h1>
        <p>Please click the link below to confirm your email:</p>
        <a href="${url}">Confirm Email</a>
        <p>If you did not create this account, please ignore this email.</p>
      `,
    });
  }
}
