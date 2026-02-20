import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { user } = await withAuth();

  if (!user) {
    return NextResponse.json({ connected: false });
  }

  const { data, error } = await supabase
    .from("slack_integrations")
    .select("team_id, team_name, bot_user_id")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    teamId: data.team_id,
    teamName: data.team_name,
    botUserId: data.bot_user_id,
  });
}
