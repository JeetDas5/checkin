"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import { Loader } from "@/components/ui/loader";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (user) {
      // Only redirect from root, not on refresh of other pages
      if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
        router.replace("/dashboard");
      } else {
        router.replace("/attendance");
      }
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Loader size="lg" text="Redirecting..." />
    </div>
  );
}
