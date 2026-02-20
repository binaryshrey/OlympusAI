import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { user } = await withAuth();

  if (!user) {
    return NextResponse.json({ connected: false });
  }

  const { data, error } = await supabase
    .from("github_integrations")
    .select("installation_id, repos")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    installationId: data.installation_id,
    repos: data.repos ?? [],
  });
}
