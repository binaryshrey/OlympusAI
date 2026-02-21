"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { getProject, upsertProject } from "@/lib/supabase";
import { toast } from "sonner";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface FormData {
  projectName: string;
  jiraId: string;
  targetPlatform: string;
  intendedUsers: string;
  description: string;
  duration: string;
  language: string;
  prioritization: string;
  documentationDepth: string;
}

interface Message {
  role: "user" | "agent" | "system";
  text: string;
}

interface SummaryClientProps {
  user: any;
  projectId: string;
}

export default function SummaryClient({ user, projectId }: SummaryClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    projectName: "",
    jiraId: "SCRUM",
    targetPlatform: "",
    intendedUsers: "",
    description: "",
    duration: "60",
    language: "English",
    prioritization: "",
    documentationDepth: "",
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatSummary, setChatSummary] = useState("");

  // Chart data
  const aiTimeData = {
    "Product Manager": 5,
    Architect: 5,
    Developer: 12,
    "QA Engineer": 7,
    "DevOps Engineer": 6,
  };

  const percentageData = {
    ai: {
      "Product Manager": 14,
      Architect: 14,
      Developer: 34,
      "QA Engineer": 20,
      "DevOps Engineer": 17,
    },
    human: {
      "Product Manager": 13,
      Architect: 17,
      Developer: 42,
      "QA Engineer": 17,
      "DevOps Engineer": 13,
    },
  };

  const timeByRoleData = {
    ai: {
      "Product Manager": 5,
      Architect: 5,
      Developer: 12,
      "QA Engineer": 7,
      "DevOps Engineer": 6,
    },
    human: {
      "Product Manager": 180,
      Architect: 240,
      Developer: 600,
      "QA Engineer": 240,
      "DevOps Engineer": 180,
    },
  };

  // Pie Chart Options
  const pieChartOptions: any = {
    chart: {
      type: "pie",
    },
    labels: Object.keys(aiTimeData),
    theme: {
      monochrome: {
        enabled: true,
        color: "#255aee",
        shadeTo: "light",
        shadeIntensity: 0.65,
      },
    },
    plotOptions: {
      pie: {
        dataLabels: {
          offset: -5,
        },
      },
    },
    dataLabels: {
      formatter(val: number, opts: any) {
        const name = opts.w.globals.labels[opts.seriesIndex];
        return [name, val.toFixed(1) + "%"];
      },
    },
    legend: {
      show: true,
      position: "bottom",
    },
    title: {
      text: "AI Agent Time Allocation (by percentage)",
      align: "center",
      style: {
        fontSize: "16px",
        fontWeight: "600",
      },
    },
  };

  const pieChartSeries = Object.values(aiTimeData);

  // Radar Chart Options
  const radarChartOptions: any = {
    chart: {
      type: "radar",
    },
    xaxis: {
      categories: Object.keys(aiTimeData),
    },
    yaxis: {
      labels: {
        formatter: function (val: number) {
          return val + " mins";
        },
      },
    },
    title: {
      text: "AI Agent Time Taken (by mins)",
      align: "center",
      style: {
        fontSize: "16px",
        fontWeight: "600",
      },
    },
    legend: {
      show: true,
      position: "bottom",
    },
    stroke: {
      width: 2,
    },
    fill: {
      opacity: 0.2,
    },
    markers: {
      size: 4,
    },
  };

  const radarChartSeries = [
    {
      name: "AI Agents",
      data: Object.values(aiTimeData),
    },
  ];

  // Stacked Column Chart Options
  const stackedColumnOptions: any = {
    chart: {
      type: "bar",
      stacked: true,
      toolbar: {
        show: true,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
      },
    },
    xaxis: {
      categories: Object.keys(timeByRoleData.ai),
      labels: {
        rotate: -45,
        rotateAlways: false,
      },
    },
    yaxis: {
      title: {
        text: "Time (minutes)",
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "center",
    },
    fill: {
      opacity: 1,
    },
    title: {
      text: "AI vs Human Time Comparison by Role",
      align: "center",
      style: {
        fontSize: "16px",
        fontWeight: "600",
      },
    },
    colors: ["#1E3A8A", "#3B82F6"],
  };

  const stackedColumnSeries = [
    {
      name: "Human Team",
      data: Object.values(timeByRoleData.human),
    },
    {
      name: "AI Agents",
      data: Object.values(timeByRoleData.ai),
    },
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        if (projectId) {
          // Load project from database using the projectId prop
          const project = await getProject(projectId);
          console.log("[Summary] Loaded project from database:", project);

          setFormData({
            projectName: project.project_name || "",
            jiraId: project.jira_id || "",
            targetPlatform: project.target_platform || "",
            intendedUsers: project.intended_users || "",
            description: project.description || "",
            duration: project.duration || "60",
            language: project.language || "English",
            prioritization: project.prioritization || "",
            documentationDepth: project.documentation_depth || "",
          });

          if (project.chat_summary) {
            setChatSummary(project.chat_summary);
          }
        }

        // Load meeting conversation from sessionStorage
        if (typeof window !== "undefined") {
          const conversationRaw = sessionStorage.getItem(
            "meeting_conversation",
          );
          if (conversationRaw) {
            const parsed = JSON.parse(conversationRaw);
            setMessages(parsed);

            const summary = parsed
              .map(
                (msg: Message) =>
                  `${msg.role === "user" ? "You" : "AI PM"}: ${msg.text}`,
              )
              .join("\n\n");
            setChatSummary(summary);
            console.log("[Summary] Loaded conversation:", parsed);
          }
        }
      } catch (err) {
        console.error("[Summary] Error loading data:", err);
        toast.error("Failed to load project data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [projectId]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate all required fields
      if (!formData.projectName.trim()) {
        throw new Error("Project name is required");
      }
      if (!formData.jiraId.trim()) {
        throw new Error("Jira Board ID is required");
      }
      if (!formData.targetPlatform) {
        throw new Error("Target Platform is required");
      }
      if (!formData.intendedUsers) {
        throw new Error("Intended Users is required");
      }
      if (!formData.description.trim()) {
        throw new Error("Given Requirements are required");
      }
      if (!formData.prioritization) {
        throw new Error("Prioritization is required");
      }
      if (!formData.documentationDepth) {
        throw new Error("Documentation Depth is required");
      }
      if (!chatSummary.trim()) {
        throw new Error("Chat Summary is required");
      }

      // Save to Supabase
      const projectData = {
        id: projectId || undefined,
        user_id: user.id,
        user_email: user.email,
        project_name: formData.projectName,
        jira_id: formData.jiraId,
        target_platform: formData.targetPlatform,
        intended_users: formData.intendedUsers,
        description: formData.description,
        duration: formData.duration,
        language: formData.language,
        prioritization: formData.prioritization,
        documentation_depth: formData.documentationDepth,
        chat_summary: chatSummary,
      };

      const savedProject = await upsertProject(projectData);
      console.log("[Summary] Project updated in database:", savedProject);

      toast.success("PRD saved successfully!");

      setTimeout(() => {
        setIsSubmitting(false);
        router.push(`/agents-workflow/${projectId}`);
      }, 1000);
    } catch (error) {
      console.error("Validation/Save error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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

      {/* Analytics Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          AI Orchestration Analytics
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Pie Chart */}
          <div className="bg-gray-50 rounded-lg p-4">
            <Chart
              options={pieChartOptions}
              series={pieChartSeries}
              type="pie"
              height={350}
            />
          </div>

          {/* Radar Chart */}
          <div className="bg-gray-50 rounded-lg p-4">
            <Chart
              options={radarChartOptions}
              series={radarChartSeries}
              type="radar"
              height={350}
            />
          </div>
        </div>

        {/* Stacked Column Chart - Full Width */}
        <div className="bg-gray-50 rounded-lg p-4">
          <Chart
            options={stackedColumnOptions}
            series={stackedColumnSeries}
            type="bar"
            height={400}
          />
        </div>
      </div>

      {/* Form Fields Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
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
                value={formData.projectName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    projectName: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                placeholder="Enter your project name"
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="jiraId"
                className="text-sm font-medium text-gray-900 block mb-2"
              >
                Jira Board ID <span className="text-red-500">*</span>
              </label>
              <input
                id="jiraId"
                type="text"
                required
                value={formData.jiraId}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                placeholder="Enter your Jira Board ID"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label
                htmlFor="targetPlatform"
                className="text-sm font-medium text-gray-900 block mb-2"
              >
                Target Platform <span className="text-red-500">*</span>
              </label>
              <select
                id="targetPlatform"
                required
                value={formData.targetPlatform}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    targetPlatform: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
              >
                <option value="">Select target platform</option>
                <option value="Web Application">Web Application</option>
                <option value="Mobile (iOS)">Mobile (iOS)</option>
                <option value="Mobile (Android)">Mobile (Android)</option>
                <option value="Desktop Application">Desktop Application</option>
                <option value="Backend API">Backend API</option>
                <option value="Full Stack">Full Stack</option>
              </select>
            </div>

            <div className="flex-1">
              <label
                htmlFor="intendedUsers"
                className="text-sm font-medium text-gray-900 block mb-2"
              >
                Intended Users <span className="text-red-500">*</span>
              </label>
              <select
                id="intendedUsers"
                required
                value={formData.intendedUsers}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    intendedUsers: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
              >
                <option value="">Select intended users</option>
                <option value="Internal Team">Internal Team</option>
                <option value="Enterprise Clients">Enterprise Clients</option>
                <option value="General Public">General Public</option>
                <option value="Developers">Developers</option>
                <option value="Business Users">Business Users</option>
              </select>
            </div>
          </div>

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
                required
                value={formData.prioritization}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    prioritization: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
              >
                <option value="">Select prioritization</option>
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
                required
                value={formData.documentationDepth}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    documentationDepth: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
              >
                <option value="">Select documentation depth</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

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
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
              placeholder="Your Requirements"
            />
          </div>

          <div>
            <label
              htmlFor="chatSummary"
              className="text-sm font-medium text-gray-900 block mb-2"
            >
              Chat Summary (from PM Meeting){" "}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              id="chatSummary"
              required
              value={chatSummary}
              onChange={(e) => setChatSummary(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
              placeholder="Summary of the conversation with AI Product Manager..."
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
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
    </div>
  );
}
