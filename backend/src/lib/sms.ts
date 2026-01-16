import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_FROM;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export const sendSms = async (to: string, body: string) => {
  if (!client || !from) return;
  await client.messages.create({ from, to, body });
};
