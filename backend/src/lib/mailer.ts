import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM;

const transporter = host && port && user && pass
  ? nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })
  : null;

export const mailerReady = Boolean(transporter && from);

export const sendMail = async (to: string[], subject: string, html: string) => {
  if (!transporter || !from) return;
  await transporter.sendMail({
    from,
    to,
    subject,
    html,
  });
};
