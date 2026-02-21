"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MeetingClient from "@/app/components/MeetingClient";

interface MeetingWrapperProps {
  user: any;
}

export default function MeetingWrapper({ user }: MeetingWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuto = searchParams.get("auto") === "true";

  const [ready, setReady] = useState(false);
  const [duration, setDuration] = useState<number>(3);

  useEffect(() => {
    const raw = sessionStorage.getItem("onboard_form_data");

    if (raw) {
      const data = JSON.parse(raw);
      if (data.duration) {
        const match = String(data.duration).match(/(\d+)/);
        if (match) setDuration(parseInt(match[1]));
      }
    } else if (!isAuto) {
      router.replace("/onboard");
      return;
    }

    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <MeetingClient
      autoStart={isAuto || true}
      duration={duration}
      user={user}
    />
  );
}
