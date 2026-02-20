"use client";

import { useState } from "react";
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

  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "jira",
      name: "Jira",
      description:
        "Connect your Jira workspace to sync projects, issues, and sprint boards automatically.",
      icon: "/integrations/jira.svg",
      connected: false,
    },
    {
      id: "github",
      name: "GitHub",
      description:
        "Link your GitHub repositories to enable code tracking, pull requests, and CI/CD integration.",
      icon: "/integrations/github.svg",
      connected: false,
    },
    {
      id: "bitbucket",
      name: "Bitbucket",
      description:
        "Connect Bitbucket to sync repositories, pipelines, and collaborate with your team seamlessly.",
      icon: "/integrations/bitbucket.svg",
      connected: false,
    },
  ]);

  const allConnected = integrations.every((i) => i.connected);

  const handleConnect = async (id: string) => {
    setConnectingId(id);

    // Simulate OAuth connection flow
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
    router.push("/onboard");
  };

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Connect Your Tools
        </h2>
        <p className="text-gray-500 mb-8">
          Integrate your project management and version control tools to get
          started with Nebula AI.
        </p>

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
          "Continue"
        )}
      </button>
    </div>
  );
}
