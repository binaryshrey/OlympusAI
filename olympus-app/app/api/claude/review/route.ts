import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  try {
    const { conversation } = await request.json();

    if (!conversation) {
      return Response.json({ error: "No conversation provided" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are analyzing a conversation between a user and an AI Product Manager. Extract the following and return ONLY valid JSON with exactly these two keys:

{
  "projectName": "a concise project name based on what was discussed",
  "givenRequirements": "a clear, structured summary of the project requirements discussed"
}

Conversation:
${conversation}`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "{}";

    // Strip markdown code fences if present
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    return Response.json(parsed);
  } catch (err: any) {
    console.error("[Claude Review] Error:", err?.message || err);
    return Response.json(
      { error: err?.message || "Failed to extract project details" },
      { status: 500 },
    );
  }
}
