"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { insertProjectRecord } from "@/lib/supabase";

interface Message {
  role: "user" | "agent" | "system";
  text: string;
}

interface ReviewClientProps {
  user: any;
}

export default function ReviewClient({ user }: ReviewClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [chatSummary, setChatSummary] = useState("");
  const [prioritization, setPrioritization] = useState("Medium");
  const [documentationDepth, setDocumentationDepth] = useState("Low");

  useEffect(() => {
    const loadAndExtract = async () => {
      try {
        // Load conversation from sessionStorage
        const conversationRaw =
          typeof window !== "undefined"
            ? sessionStorage.getItem("meeting_conversation")
            : null;

        if (!conversationRaw) {
          setLoading(false);
          return;
        }

        const parsed: Message[] = JSON.parse(conversationRaw);
        const summary = parsed
          .map((msg) => `${msg.role === "user" ? "You" : "AI PM"}: ${msg.text}`)
          .join("\n\n");
        setChatSummary(summary);

        // Call Claude API to extract project name and requirements
        const res = await fetch("/api/claude/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversation: summary }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to extract project details");
        }
        if (data.projectName) setProjectName(data.projectName);
        if (data.givenRequirements) setDescription(data.givenRequirements);
      } catch (err) {
        console.error("[Review] Error loading data:", err);
        toast.error("Failed to extract project details");
      } finally {
        setLoading(false);
      }
    };

    loadAndExtract();
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (!projectName.trim()) throw new Error("Project name is required");
      if (!description.trim()) throw new Error("Given Requirements are required");

      const saved = await insertProjectRecord({
        user_id: user.id,
        user_email: user.email ?? undefined,
        project_name: projectName.trim(),
        prioritization,
        documentation_depth: documentationDepth,
        given_requirements: description.trim(),
        meeting_transcript: chatSummary || undefined,
      });

      toast.success("Review saved!");
      setTimeout(() => {
        router.push(`/agents-workflow/${saved.id}`);
      }, 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(msg);
      toast.error(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-gray-600 text-sm">Analyzing your meeting...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Requirements Review
        </h1>
        <p className="text-gray-600">
          Review and edit your project requirements gathered from the AI Product
          Manager meeting
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <h3 className="text-sm font-semibold text-red-900">Error</h3>
          </div>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Form Fields */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="space-y-4">
          {/* Project Name */}
          <div>
            <label
              htmlFor="projectName"
              className="text-sm font-medium text-gray-900 block mb-2"
            >
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              id="projectName"
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
              placeholder="Enter your project name"
            />
          </div>

          {/* Prioritization + Documentation Depth */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label
                htmlFor="prioritization"
                className="text-sm font-medium text-gray-900 block mb-2"
              >
                Prioritization <span className="text-red-500">*</span>
              </label>
              <select
                id="prioritization"
                value={prioritization}
                onChange={(e) => setPrioritization(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="flex-1">
              <label
                htmlFor="documentationDepth"
                className="text-sm font-medium text-gray-900 block mb-2"
              >
                Documentation Depth <span className="text-red-500">*</span>
              </label>
              <select
                id="documentationDepth"
                value={documentationDepth}
                onChange={(e) => setDocumentationDepth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Given Requirements */}
          <div>
            <label
              htmlFor="description"
              className="text-sm font-medium text-gray-900 block mb-2"
            >
              Given Requirements <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
              placeholder="Your requirements"
            />
          </div>

          {/* Chat Summary */}
          <div>
            <label
              htmlFor="chatSummary"
              className="text-sm font-medium text-gray-900 block mb-2"
            >
              Meeting Transcripts (from PM Meeting)
            </label>
            <textarea
              id="chatSummary"
              readOnly
              value={chatSummary}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed outline-none resize-none"
              placeholder="Transcript of the conversation with AI Product Manager..."
            />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full px-6 py-4 text-base bg-black text-white font-semibold rounded-md disabled:opacity-50 hover:bg-gray-800 transition-colors"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2 inline" />
            Processing...
          </>
        ) : (
          "Continue to AI Agents Workflow"
        )}
      </button>
    </div>
  );
}
