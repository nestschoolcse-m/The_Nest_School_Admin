"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardContent } from "./dashboard/Content";
import { DateProvider } from "@/contexts/date-context";
import { auth } from "@/lib/firebase-client";
import { onAuthStateChanged } from "firebase/auth";

export default function Page() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setReady(true);
      } else {
        // Fallback to localStorage just for immediate UI check, 
        // but AuthGate will handle the actual redirect
        const current = localStorage.getItem("nest_current_user");
        if (current) {
          setReady(true);
        } else {
          router.replace("/auth");
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (!ready) return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
  );

  return (
    <DateProvider>
      <DashboardContent />
    </DateProvider>
  );
}
