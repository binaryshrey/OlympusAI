import { Suspense } from "react";
import { withAuth } from "@workos-inc/authkit-nextjs";
import MeetingWrapper from "@/app/components/MeetingWrapper";

export default async function Meeting() {
  const { user } = await withAuth();

  if (!user) return null;

  return (
    <div className="relative min-h-screen">
      <Suspense>
        <MeetingWrapper user={user} />
      </Suspense>
    </div>
  );
}
