import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@workos-inc/authkit-nextjs";

export async function GET(request: NextRequest) {
  const { user } = await withAuth();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = process.env.SLACK_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Missing Slack OAuth configuration" },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    scope: "chat:write,channels:read,channels:join,users:read,app_mentions:read",
    redirect_uri: redirectUri,
    state: user.id,
  });

  return NextResponse.redirect(
    `https://slack.com/oauth/v2/authorize?${params.toString()}`
  );
}
