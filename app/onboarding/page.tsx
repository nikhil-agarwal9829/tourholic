"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import PlanExpeditionModal from "@/components/preferences/PlanExpeditionModal";
import { Compass } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  const handleFinish = () => {
    setIsOpen(false);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#fbfaf8] flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#124e3f] flex items-center justify-center text-white shadow-lg">
          <Compass className="w-7 h-7" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#1c2421]">
          Welcome to Touroholic
        </h1>
        <p className="text-xs text-stone-600">
          Setting up your personalized expedition discovery engine...
        </p>
      </div>

      <PlanExpeditionModal
        isOpen={isOpen}
        onClose={handleFinish}
        initialPreferences={user?.travelPreferences}
        onSaved={handleFinish}
      />
    </div>
  );
}
