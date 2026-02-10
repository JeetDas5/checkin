"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import apiClient from "@/lib/api";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [domains, setDomains] = useState([]);
  const [step, setStep] = useState(1); // 1: Form, 2: OTP Verification
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roll: "",
    domainId: "",
  });

  useEffect(() => {
    // Fetch domains for the dropdown
    const fetchDomains = async () => {
      try {
        const response = await apiClient.get("/domains");

        setDomains(response.data.domains || []);
      } catch (error) {
        console.error("Error fetching domains:", error);
        toast.error("Failed to load domains");
      }
    };
    fetchDomains();
  }, []);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.endsWith("@kiit.ac.in")) {
      toast.error("Only @kiit.ac.in email addresses are allowed.");
      return;
    }

    setIsLoading(true);

    try {
      // Send OTP to email
      await apiClient.post("/otp/send", {
        email: formData.email,
        name: formData.name,
      });
      toast.success("OTP sent to your email!");
      setOtpSent(true);
      setStep(2);
      setResendTimer(60); // 60 seconds cooldown
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      // Verify OTP
      await apiClient.post("/otp/verify", {
        email: formData.email,
        otp,
      });
      toast.success("Email verified! Creating your account...");

      // Now create the account
      await apiClient.post("/auth/signup", formData);
      toast.success("Registration successful! Please login.");
      router.push("/login");
    } catch (error) {
      console.error("Verification/Registration error:", error);
      toast.error(error.response?.data?.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) {
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post("/otp/resend", {
        email: formData.email,
        name: formData.name,
      });
      toast.success("New OTP sent to your email!");
      setResendTimer(60);
      setOtp("");
    } catch (error) {
      console.error("Error resending OTP:", error);
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md border-slate-200 dark:border-slate-800 shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {step === 1 ? "Create an account" : "Verify your email"}
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            {step === 1
              ? "Enter your details to get started"
              : `We've sent a 6-digit code to ${formData.email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roll" className="text-sm font-medium">
                  Roll Number
                </Label>
                <Input
                  id="roll"
                  name="roll"
                  type="text"
                  placeholder="2201001"
                  value={formData.roll}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain" className="text-sm font-medium">
                  Domain
                </Label>
                <Select
                  value={formData.domainId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, domainId: value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select a domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {domains.map((domain) => (
                      <SelectItem key={domain.id} value={domain.id}>
                        {domain.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full h-10"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader className="mr-2" size="sm" />
                    Sending OTP...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm font-medium">
                  Enter OTP Code
                </Label>
                <Input
                  id="otp"
                  name="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setOtp(value);
                  }}
                  maxLength={6}
                  required
                  disabled={isLoading}
                  className="h-12 text-center text-2xl tracking-widest font-mono"
                  autoFocus
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                  Code expires in 10 minutes
                </p>
              </div>

              <Button
                onClick={handleVerifyOtp}
                className="w-full h-10"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader className="mr-2" size="sm" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Create Account"
                )}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Didn't receive the code?
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || isLoading}
                  className="text-sm"
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep(1);
                  setOtp("");
                  setOtpSent(false);
                }}
                className="w-full h-10"
                disabled={isLoading}
              >
                Back to Form
              </Button>
            </div>
          )}
          <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/login")}
              className="text-slate-900 dark:text-slate-100 hover:underline font-medium"
            >
              Sign in
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
