"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";

const refreshIntervalMs = 5000;

export function LiveRegistrationUpdates() {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  useEffect(() => {
    if (isRefreshing) return;

    function refreshVisibleTab() {
      if (document.visibilityState === "visible") {
        startTransition(() => router.refresh());
      }
    }

    const timer = window.setInterval(refreshVisibleTab, refreshIntervalMs);
    document.addEventListener("visibilitychange", refreshVisibleTab);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshVisibleTab);
    };
  }, [isRefreshing, router, startTransition]);

  return null;
}
