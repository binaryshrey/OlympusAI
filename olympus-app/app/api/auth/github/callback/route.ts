import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { supabase } from "@/lib/supabase";
import { getInstallationRepos } from "@/lib/github";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const installationId = searchParams.get("installation_id");
  const setupAction = searchParams.get("setup_action"); // "install" | "update"

  const setupUrl = new URL("/onboard-team", request.url);

  if (!installationId) {
    setupUrl.searchParams.set("error", "github_missing_installation");
    return NextResponse.redirect(setupUrl);
  }

  try {
    // Get authenticated user from WorkOS session cookie
    const { user } = await withAuth();

    if (!user) {
      setupUrl.searchParams.set("error", "github_unauthenticated");
      return NextResponse.redirect(setupUrl);
    }

    // Fetch accessible repos to confirm installation works + store repo list
    let repos: Array<{ name: string; full_name: string; html_url: string; default_branch: string }> = [];
    try {
      repos = await getInstallationRepos(installationId);
    } catch {
      // Non-fatal — we can still store the installation_id
      console.warn("[GitHub callback] Could not fetch repos, storing installation_id only");
    }

    const repoNames = repos.map((r) => r.full_name);

    // Store installation in Supabase
    const { error: dbError } = await supabase
      .from("github_integrations")
      .upsert(
        {
          user_id: user.id,
          installation_id: installationId,
          repos: repoNames,
          setup_action: setupAction ?? "install",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (dbError) {
      console.error("[GitHub callback] Supabase error:", dbError);
      throw new Error("Failed to store GitHub integration");
    }

    setupUrl.searchParams.set("github", "connected");
    return NextResponse.redirect(setupUrl);
  } catch (err) {
    console.error("[GitHub callback] Error:", err);
    setupUrl.searchParams.set("error", "github_callback_failed");
    return NextResponse.redirect(setupUrl);
  }
}
