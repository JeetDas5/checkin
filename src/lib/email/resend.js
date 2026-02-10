import { Resend } from "resend";
import { generateOtpEmailHtml } from "./templates/otp-template";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = "onboarding@resend.dev"; // The user might want to change this later, but for now using default or what's in unosend

// Use onboarding@resend.dev for testing if you haven't verified a domain yet
// const DEFAULT_FROM = "CheckIn <onboarding@resend.dev>";
// Once you verify your domain, you can change it to:
const DEFAULT_FROM = "CheckIn <hello@jeetdas.tech>";

export async function sendEmail({ to, subject, html, from = DEFAULT_FROM }) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      throw new Error(`Resend API error: ${error.message}`);
    }

    console.log("Email sent successfully via Resend:", data.id);
    return data;
  } catch (error) {
    console.error("Error sending email via Resend:", error);
    throw error;
  }
}

export async function sendOtpEmail(email, otp, name = "User") {
  const subject = "Verify Your Email - CheckIn";
  const html = generateOtpEmailHtml(otp, name);

  return sendEmail({
    to: email,
    subject,
    html,
  });
}
