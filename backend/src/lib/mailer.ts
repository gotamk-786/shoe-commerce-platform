import nodemailer from "nodemailer";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM;

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM;

const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

const transporter = host && port && user && pass
  ? nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })
  : null;

export const mailerReady = Boolean(
  (resendClient && resendFrom) || (transporter && smtpFrom),
);

export const sendMail = async (to: string[], subject: string, html: string) => {
  if (resendClient && resendFrom) {
    await resendClient.emails.send({
      from: resendFrom,
      to,
      subject,
      html,
    });
    return;
  }

  if (!transporter || !smtpFrom) return;
  await transporter.sendMail({
    from: smtpFrom,
    to,
    subject,
    html,
  });
};
