import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { user } = await withAuth();

  if (!user) {
    return NextResponse.json({ connected: false });
  }

  const { data, error } = await supabase
    .from("jira_integrations")
    .select("cloud_id, site_url, site_name")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    cloudId: data.cloud_id,
    siteUrl: data.site_url,
    siteName: data.site_name,
  });
}
