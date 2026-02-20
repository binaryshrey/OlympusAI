import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const userId = searchParams.get("state");
  const error = searchParams.get("error");

  const setupUrl = new URL("/setup", request.url);

  if (error) {
    setupUrl.searchParams.set("error", "jira_auth_failed");
    return NextResponse.redirect(setupUrl);
  }

  if (!code || !userId) {
    setupUrl.searchParams.set("error", "jira_missing_params");
    return NextResponse.redirect(setupUrl);
  }

  const clientId = process.env.JIRA_CLIENT_ID;
  const clientSecret = process.env.JIRA_CLIENT_SECRET;
  const redirectUri = process.env.JIRA_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    setupUrl.searchParams.set("error", "jira_config_missing");
    return NextResponse.redirect(setupUrl);
  }

  try {
    // Step 1: Exchange code for tokens
    const tokenResponse = await fetch("https://auth.atlassian.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("[Jira callback] Token exchange failed:", errText);
      throw new Error("Failed to exchange code for token");
    }

    const { access_token, refresh_token, expires_in } = await tokenResponse.json();

    // Step 2: Get accessible Jira cloud resources
    const resourcesResponse = await fetch(
      "https://api.atlassian.com/oauth/token/accessible-resources",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    if (!resourcesResponse.ok) {
      throw new Error("Failed to fetch Jira resources");
    }

    const resources = await resourcesResponse.json();

    // Always connect to the fixed Olympus Jira site
    const TARGET_SITE_URL = "https://olympusss.atlassian.net";
    const TARGET_PROJECT_KEY = "ADB";
    const TARGET_BOARD_ID = 2;

    const cloud =
      resources.find((r: { url: string }) => r.url === TARGET_SITE_URL) ??
      resources[0];

    if (!cloud) {
      throw new Error("No Jira cloud found for this account");
    }

    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Step 3: Store integration in Supabase
    const { error: dbError } = await supabase
      .from("jira_integrations")
      .upsert(
        {
          user_id: userId,
          access_token,
          refresh_token,
          expires_at: expiresAt,
          cloud_id: cloud.id,
          site_url: TARGET_SITE_URL,
          site_name: cloud.name,
          project_key: TARGET_PROJECT_KEY,
          board_id: TARGET_BOARD_ID,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (dbError) {
      console.error("[Jira callback] Supabase error:", dbError);
      throw new Error("Failed to store Jira integration");
    }

    setupUrl.searchParams.set("jira", "connected");
    return NextResponse.redirect(setupUrl);
  } catch (err) {
    console.error("[Jira callback] Error:", err);
    setupUrl.searchParams.set("error", "jira_callback_failed");
    return NextResponse.redirect(setupUrl);
  }
}
