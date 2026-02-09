import { generateOtpEmailHtml } from "./templates/otp-template";

const UNOSEND_API_URL = "https://www.unosend.co/api/v1/emails";
const UNOSEND_API_KEY = process.env.UNOSEND_API_KEY;
const FROM_EMAIL = "hello@jeetdas.tech";

export async function sendEmail({ to, subject, html, from = FROM_EMAIL }) {
  if (!UNOSEND_API_KEY) {
    throw new Error("UNOSEND_API_KEY is not configured");
  }

  try {
    const response = await fetch(UNOSEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UNOSEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Unosend API error: ${response.status} - ${
          errorData.message || response.statusText
        }`
      );
    }

    const data = await response.json();
    console.log("Email sent successfully:", data.id);
    return data;
  } catch (error) {
    console.error("Error sending email:", error);
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
