import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const userId = searchParams.get("state");
  const error = searchParams.get("error");

  const setupUrl = new URL("/setup", request.url);

  if (error) {
    setupUrl.searchParams.set("error", "slack_auth_failed");
    return NextResponse.redirect(setupUrl);
  }

  if (!code || !userId) {
    setupUrl.searchParams.set("error", "slack_missing_params");
    return NextResponse.redirect(setupUrl);
  }

  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const redirectUri = process.env.SLACK_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    setupUrl.searchParams.set("error", "slack_config_missing");
    return NextResponse.redirect(setupUrl);
  }

  try {
    // Exchange code for bot token
    const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    const data = await tokenResponse.json();

    if (!data.ok) {
      console.error("[Slack callback] Token exchange error:", data.error);
      throw new Error(`Slack OAuth error: ${data.error}`);
    }

    const botToken = data.access_token;
    const teamId = data.team?.id;
    const teamName = data.team?.name;
    const botUserId = data.bot_user_id;

    // Store in Supabase
    const { error: dbError } = await supabase
      .from("slack_integrations")
      .upsert(
        {
          user_id: userId,
          team_id: teamId,
          team_name: teamName,
          bot_token: botToken,
          bot_user_id: botUserId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (dbError) {
      console.error("[Slack callback] Supabase error:", dbError);
      throw new Error("Failed to store Slack integration");
    }

    setupUrl.searchParams.set("slack", "connected");
    return NextResponse.redirect(setupUrl);
  } catch (err) {
    console.error("[Slack callback] Error:", err);
    setupUrl.searchParams.set("error", "slack_callback_failed");
    return NextResponse.redirect(setupUrl);
  }
}
