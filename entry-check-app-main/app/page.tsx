"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardContent } from "./dashboard/Content";
import { DateProvider } from "@/contexts/date-context";

export default function Page() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const current = localStorage.getItem("nest_current_user");
      if (!current) {
        router.replace("/auth");
        return;
      }
      setReady(true);
    } catch (e) {
      router.replace("/auth");
    }
  }, [router]);

  if (!ready) return null;
  return (
    <DateProvider>
      <DashboardContent />
    </DateProvider>
  );
}
