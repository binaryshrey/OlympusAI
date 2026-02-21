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

  const [projectId, setProjectId] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(2);

  useEffect(() => {
    const raw = sessionStorage.getItem("onboard_form_data");

    if (!raw || !JSON.parse(raw).projectId) {
      if (isAuto) {
        // Coming from /pm-meeting device setup — start without requiring onboard form
        setProjectId("auto");
        return;
      }
      router.replace("/onboard");
      return;
    }

    const data = JSON.parse(raw);
    setProjectId(data.projectId);

    if (data.duration) {
      const match = String(data.duration).match(/(\d+)/);
      if (match) setDuration(parseInt(match[1]));
    }
  }, []);

  if (!projectId) return null;

  return (
    <MeetingClient
      autoStart={isAuto || true}
      duration={duration}
      user={user}
      projectId={projectId}
    />
  );
}
