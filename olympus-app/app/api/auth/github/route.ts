import { NextRequest, NextResponse } from "next/server";

// Redirects user to GitHub App installation page
export async function GET(request: NextRequest) {
  const appName = process.env.GITHUB_APP_NAME;

  if (!appName) {
    return NextResponse.json(
      { error: "Missing GITHUB_APP_NAME env var" },
      { status: 500 }
    );
  }

  const installUrl = `https://github.com/apps/${appName}/installations/new`;
  return NextResponse.redirect(installUrl);
}
