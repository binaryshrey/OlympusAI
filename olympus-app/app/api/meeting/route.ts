import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const anamApiKey = process.env.ANAM_PM_API_KEY;
  const avatarPMId = process.env.ANAM_PM_AVATAR_ID;
  const elevenLabsPMAgentId = process.env.ELEVENLABS_PM_AGENT_ID;
  const anamAuthURI = process.env.ANAM_AUTH_URI;

  if (!anamApiKey || !avatarPMId || !elevenLabsPMAgentId || !anamAuthURI) {
    return NextResponse.json(
      {
        error:
          "Missing environment variables. Check ANAM_PM_API_KEY, ANAM_PM_AVATAR_ID, ELEVENLABS_PM_AGENT_ID, and ANAM_AUTH_URI",
      },
      { status: 500 },
    );
  }

  try {
    console.log("[Meeting API] Fetching Anam token...");

    const response = await fetch(anamAuthURI, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anamApiKey}`,
      },
      body: JSON.stringify({
        personaConfig: {
          avatarId: avatarPMId,
          enableAudioPassthrough: true,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => response.statusText);
      console.error("Anam API error:", error);
      throw new Error("Failed to get Anam session token");
    }

    const data = await response.json();
    const anamToken = data.sessionToken;
    console.log("[Meeting API] Token acquired successfully");

    return NextResponse.json({
      anamSessionToken: anamToken,
      elevenLabsAgentId: elevenLabsPMAgentId,
    });
  } catch (error) {
    console.error("Config error:", error);
    return NextResponse.json(
      { error: "Failed to get config" },
      { status: 500 },
    );
  }
}
