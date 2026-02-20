import { withAuth } from "@workos-inc/authkit-nextjs";
import MeetingClient from "@/app/components/MeetingClient";
import { getProject } from "@/lib/supabase";
import { notFound } from "next/navigation";

export default async function Meeting({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const { user } = await withAuth();

  if (!user) return null;

  // Fetch project from database to get duration
  let project;
  try {
    project = await getProject(resolvedParams.id);

    // Verify the project belongs to the current user
    if (project.user_id !== user.id) {
      notFound();
    }
  } catch (error) {
    console.error("Error loading project:", error);
    notFound();
  }

  // Convert duration string to number (e.g., "1 minute" -> 1)
  let duration = 2; // Default 2 minutes
  if (project.duration) {
    const match = project.duration.match(/(\d+)/);
    if (match) {
      duration = parseInt(match[1]);
    }
  }

  return (
    <div className="relative min-h-screen">
      <MeetingClient
        autoStart={true}
        duration={duration}
        user={user}
        projectId={resolvedParams.id}
      />
    </div>
  );
}
