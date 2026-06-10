import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class ResendService {
  private resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY || 're_placeholder';
    this.resend = new Resend(apiKey);
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      await this.resend.emails.send({
        from: 'IndraNetra Alert <onboarding@resend.dev>', // Resend free tier sandbox domain
        to,
        subject,
        html,
      });
      console.log(`Resend email sent to ${to} successfully.`);
    } catch (error) {
      console.error('Failed to send email via Resend:', error.message);
    }
  }
}
