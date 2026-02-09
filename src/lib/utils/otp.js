/**
 * OTP Utility Functions
 * Handles OTP generation, validation, and management
 */

import { prisma } from "../prisma";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

/**
 * Generate a random numeric OTP
 * @param {number} length - Length of OTP (default: 6)
 * @returns {string} Generated OTP
 */
export function generateOtp(length = OTP_LENGTH) {
  const digits = "0123456789";
  let otp = "";

  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }

  return otp;
}

/**
 * Create and store OTP in database
 * @param {string} email - User's email
 * @returns {Promise<Object>} Created OTP record
 */
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

/**
 * Verify OTP for an email
 * @param {string} email - User's email
 * @param {string} otp - OTP to verify
 * @returns {Promise<Object>} Verification result
 */
export async function verifyOtp(email, otp) {
  // Find the most recent OTP for this email
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

/**
 * Check if email has a verified OTP
 * @param {string} email - User's email
 * @returns {Promise<boolean>} True if email has verified OTP
 */
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

/**
 * Delete verified OTP after successful signup
 * @param {string} email - User's email
 * @returns {Promise<void>}
 */
export async function deleteVerifiedOtp(email) {
  await prisma.otp.deleteMany({
    where: {
      email,
      verified: true,
    },
  });
}

/**
 * Clean up expired OTPs (can be run as a cron job)
 * @returns {Promise<number>} Number of deleted records
 */
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
