"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
}

export default function SetupClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "jira",
      name: "Jira",
      description:
        "Connect your Jira workspace to sync projects, issues, and sprint boards automatically.",
      icon: "/jiraa.svg",
      connected: false,
    },
    {
      id: "github",
      name: "GitHub",
      description:
        "Link your GitHub repositories to enable code tracking, pull requests, and CI/CD integration.",
      icon: "/githubb.svg",
      connected: false,
    },
    {
      id: "slack",
      name: "Slack",
      description:
        "Connect Slack to enable real-time collaboration, notifications, and AI agent communication with your team.",
      icon: "/slackk.svg",
      connected: false,
    },
  ]);

  // On mount: handle OAuth/install redirect params + check existing connections
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("jira") === "connected") {
      setIntegrations((prev) =>
        prev.map((i) => (i.id === "jira" ? { ...i, connected: true } : i)),
      );
      setStatusMessage({
        type: "success",
        text: "Jira connected ✓ — AI PM now has access to your workspace",
      });
      window.history.replaceState({}, "", "/onboard-team");
    } else if (params.get("github") === "connected") {
      setIntegrations((prev) =>
        prev.map((i) => (i.id === "github" ? { ...i, connected: true } : i)),
      );
      setStatusMessage({
        type: "success",
        text: "GitHub connected ✓ — Agents can now push code to your repos",
      });
      window.history.replaceState({}, "", "/onboard-team");
    } else if (params.get("slack") === "connected") {
      setIntegrations((prev) =>
        prev.map((i) => (i.id === "slack" ? { ...i, connected: true } : i)),
      );
      setStatusMessage({
        type: "success",
        text: "Slack connected ✓ — Agents can now message your workspace",
      });
      window.history.replaceState({}, "", "/onboard-team");
    } else if (params.get("error")) {
      setStatusMessage({
        type: "error",
        text: "Failed to connect. Please try again.",
      });
      window.history.replaceState({}, "", "/onboard-team");
    }

    // Always check existing connections in parallel
    Promise.all([
      fetch("/api/auth/jira/status")
        .then((r) => r.json())
        .catch(() => ({ connected: false })),
      fetch("/api/auth/github/status")
        .then((r) => r.json())
        .catch(() => ({ connected: false })),
      fetch("/api/auth/slack/status")
        .then((r) => r.json())
        .catch(() => ({ connected: false })),
    ]).then(([jira, github, slack]) => {
      setIntegrations((prev) =>
        prev.map((i) => {
          if (i.id === "jira" && jira.connected)
            return { ...i, connected: true };
          if (i.id === "github" && github.connected)
            return { ...i, connected: true };
          if (i.id === "slack" && slack.connected)
            return { ...i, connected: true };
          return i;
        }),
      );
    });
  }, []);

  const allConnected = integrations.every((i) => i.connected);

  const handleConnect = async (id: string) => {
    if (id === "jira") {
      window.location.href = "/api/auth/jira";
      return;
    }

    if (id === "github") {
      window.location.href = "/api/auth/github";
      return;
    }

    if (id === "slack") {
      window.location.href = "/api/auth/slack";
      return;
    }

    setConnectingId(id);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === id
          ? { ...integration, connected: true }
          : integration,
      ),
    );
    setConnectingId(null);
  };

  const handleContinue = () => {
    setIsLoading(true);
    router.push("/pm-meeting");
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          OlympusAI Configuration Setup
        </h1>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`px-4 py-3 rounded-lg text-sm font-medium ${
            statusMessage.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Block 1: Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-gray-900">Configuration</h2>
        <p className="text-sm text-gray-500 mt-1">
          Connect your tools so our AI Product Manager can orchestrate
          end-to-end software delivery for you.
        </p>
      </div>

      {/* Block 2: Apps */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <div className="space-y-4">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="flex items-center justify-between border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-50 border border-gray-100 shrink-0">
                  <img
                    src={integration.icon}
                    alt={integration.name}
                    className="h-7 w-7"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).parentElement!.innerHTML =
                        `<span class="text-lg font-bold text-gray-400">${integration.name[0]}</span>`;
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-gray-900">
                    {integration.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {integration.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-4">
                {integration.connected ? (
                  <div className="flex items-center gap-2 px-4 py-2">
                    <span className="text-sm font-medium text-green-600">
                      Connected
                    </span>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnect(integration.id)}
                    disabled={connectingId === integration.id}
                    className="px-5 py-2 text-sm font-medium bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {connectingId === integration.id ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connecting...
                      </span>
                    ) : (
                      "Connect"
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleContinue}
        disabled={!allConnected || isLoading}
        className="w-full px-6 py-4 text-base bg-black text-white font-semibold rounded-md disabled:opacity-50 hover:bg-gray-800 transition-colors cursor-pointer"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2 inline" />
            Processing...
          </>
        ) : (
          "Continue To Device Setup"
        )}
      </button>
    </div>
  );
}
