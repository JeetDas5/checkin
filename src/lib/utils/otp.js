import { prisma } from "../prisma";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

export function generateOtp(length = OTP_LENGTH) {
  const digits = "0123456789";
  let otp = "";

  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }

  return otp;
}

export async function createOtp(email) {
  // Delete any existing unverified OTPs for this email
  await prisma.otp.deleteMany({
    where: {
      email,
      verified: false,
    },
  });

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const otpRecord = await prisma.otp.create({
    data: {
      email,
      otp,
      expiresAt,
      verified: false,
    },
  });

  return otpRecord;
}

export async function verifyOtp(email, otp) {
  const otpRecord = await prisma.otp.findFirst({
    where: {
      email,
      otp,
      verified: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!otpRecord) {
    return {
      success: false,
      message: "Invalid OTP code",
    };
  }

  // Check if OTP has expired
  if (new Date() > otpRecord.expiresAt) {
    return {
      success: false,
      message: "OTP has expired. Please request a new one.",
    };
  }

  // Mark OTP as verified
  await prisma.otp.update({
    where: {
      id: otpRecord.id,
    },
    data: {
      verified: true,
    },
  });

  return {
    success: true,
    message: "OTP verified successfully",
  };
}

export async function hasVerifiedOtp(email) {
  const verifiedOtp = await prisma.otp.findFirst({
    where: {
      email,
      verified: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return !!verifiedOtp;
}

export async function deleteVerifiedOtp(email) {
  await prisma.otp.deleteMany({
    where: {
      email,
      verified: true,
    },
  });
}

export async function cleanupExpiredOtps() {
  const result = await prisma.otp.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return result.count;
}
