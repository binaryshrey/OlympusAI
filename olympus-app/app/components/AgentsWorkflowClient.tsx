"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Circle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";

type TaskStatus = "pending" | "running" | "done" | "error";

interface TaskResult {
  // Jira
  issues?: { key: string; summary: string }[];
  siteUrl?: string;
  projectKey?: string;
  boardUrl?: string;
  // GitHub
  repoUrl?: string;
  repoName?: string;
  // PRD
  prd?: string;
  githubPrdUrl?: string;
  jiraUpdated?: boolean;
  jiraIssueKey?: string;
  // Architecture
  architectureContent?: string;
  githubArchitectureUrl?: string;
  // Tech Stack
  techStackContent?: string;
  githubTechStackUrl?: string;
  // Architect Jira
  architectJiraUpdated?: boolean;
  architectJiraIssueKey?: string;
  // Error
  error?: string;
}

interface Task {
  id: "jira" | "github" | "prd" | "architecture" | "techstack" | "architect_jira";
  label: string;
  status: TaskStatus;
  result?: TaskResult;
}

const TASK_DEFS: Pick<Task, "id" | "label">[] = [
  {
    id: "jira",
    label:
      "Jira User Stories for AI Product Manager, AI Architect, AI Developer, AI QA Engineer, AI DevOps Engineer",
  },
  {
    id: "github",
    label: "Create GitHub Repository",
  },
  {
    id: "prd",
    label: "Create Product Requirements Document (PRD)",
  },
  {
    id: "architect_jira",
    label: "Update Jira",
  },
  {
    id: "architecture",
    label: "System Architecture",
  },
  {
    id: "techstack",
    label: "Technology Stack Recommendations",
  },
];

interface AgentsWorkflowClientProps {
  user: any;
  projectId: string;
}

export default function AgentsWorkflowClient({
  user,
  projectId,
}: AgentsWorkflowClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"tasks" | "workflow">("tasks");
  const [tasks, setTasks] = useState<Task[]>(
    TASK_DEFS.map((t) => ({ ...t, status: "pending" })),
  );
  const [prdExpanded, setPrdExpanded] = useState(false);
  const [architectureExpanded, setArchitectureExpanded] = useState(false);
  const [techStackExpanded, setTechStackExpanded] = useState(false);

  const [runningAccordion, setRunningAccordion] = useState<string | null>(null);

  const runTasksByIds = async (taskIds: Task["id"][]) => {
    const completedResults: Record<string, any> = {};

    // Seed completedResults from already-done tasks
    tasks.forEach((t) => {
      if (t.status === "done" && t.result) completedResults[t.id] = t.result;
    });

    for (const id of taskIds) {
      const idx = TASK_DEFS.findIndex((d) => d.id === id);
      if (idx === -1) continue;

      setTasks((prev) =>
        prev.map((t, i) => (i === idx ? { ...t, status: "running" } : t)),
      );

      try {
        const body: Record<string, any> = { task: id, projectId };

        if (id === "prd") {
          if (completedResults.jira) body.jiraResult = completedResults.jira;
          if (completedResults.github) body.githubResult = completedResults.github;
        }
        if (id === "architect_jira") {
          if (completedResults.jira) body.jiraResult = completedResults.jira;
        }

        const res = await fetch("/api/agents/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();

        if (!res.ok) {
          setTasks((prev) =>
            prev.map((t, i) =>
              i === idx
                ? { ...t, status: "error", result: { error: data.error } }
                : t,
            ),
          );
        } else {
          completedResults[id] = data;
          setTasks((prev) =>
            prev.map((t, i) =>
              i === idx ? { ...t, status: "done", result: data } : t,
            ),
          );
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unexpected error";
        setTasks((prev) =>
          prev.map((t, i) =>
            i === idx ? { ...t, status: "error", result: { error: msg } } : t,
          ),
        );
      }
    }
  };

  const runTasks = async () => {
    await runTasksByIds(TASK_DEFS.map((d) => d.id));
  };

  const runAccordion = async (accordionId: string, taskIds: Task["id"][]) => {
    if (runningAccordion) return;
    setRunningAccordion(accordionId);
    await runTasksByIds(taskIds);
    setRunningAccordion(null);
  };

  const allDone = tasks.every(
    (t) => t.status === "done" || t.status === "error",
  );

  const StatusIcon = ({ status }: { status: TaskStatus }) => {
    if (status === "pending")
      return <Circle className="h-5 w-5 text-gray-300 shrink-0" />;
    if (status === "running")
      return (
        <Loader2 className="h-5 w-5 animate-spin text-blue-500 shrink-0" />
      );
    if (status === "done")
      return <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />;
    return <XCircle className="h-5 w-5 text-red-500 shrink-0" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          AI Agents Workflow
        </h1>
        <p className="text-gray-600">
          Review the work done by our AI agents on your project
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex gap-1">
          {(["tasks", "workflow"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={runTasks}
          className="mb-1 px-4 py-1.5 text-sm font-medium bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          Run Workflow
        </button>
      </div>

      {/* Tasks tab */}
      {activeTab === "tasks" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 shadow-sm">
          <Accordion type="single" collapsible defaultValue="item-1">
            {/* ── AI Product Manager ── */}
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg font-semibold">
                AI Product Manager
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  {tasks
                    .filter(
                      (t) =>
                        t.id === "jira" || t.id === "github" || t.id === "prd",
                    )
                    .map((task) => (
                      <div key={task.id} className="space-y-2">
                        <div className="flex items-start gap-3">
                          <StatusIcon status={task.status} />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm leading-snug ${
                                task.status === "pending"
                                  ? "text-gray-600"
                                  : "text-gray-800 font-medium"
                              }`}
                            >
                              {task.label}
                            </p>

                            {/* Jira result */}
                            {task.id === "jira" &&
                              task.status === "done" &&
                              task.result?.issues && (
                                <div className="mt-2 space-y-1">
                                  <div className="flex items-center gap-3">
                                    <p className="text-xs text-gray-500">
                                      {task.result.issues.length} stories
                                      created in{" "}
                                      <span className="font-medium">
                                        {task.result.projectKey}
                                      </span>
                                    </p>
                                    {task.result.boardUrl && (
                                      <a
                                        href={task.result.boardUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                                      >
                                        <ExternalLink className="h-3 w-3 shrink-0" />
                                        View Board
                                      </a>
                                    )}
                                  </div>
                                  {task.result.issues.map((issue) => (
                                    <a
                                      key={issue.key}
                                      href={`${task.result?.siteUrl}/browse/${issue.key}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline truncate"
                                    >
                                      <ExternalLink className="h-3 w-3 shrink-0" />
                                      <span className="font-mono font-medium">
                                        {issue.key}
                                      </span>
                                      <span className="text-gray-600 truncate">
                                        {issue.summary}
                                      </span>
                                    </a>
                                  ))}
                                </div>
                              )}

                            {/* GitHub result */}
                            {task.id === "github" &&
                              task.status === "done" &&
                              task.result?.repoUrl && (
                                <div className="mt-2">
                                  <a
                                    href={task.result.repoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                  >
                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                    {task.result.repoName}
                                  </a>
                                </div>
                              )}

                            {/* PRD result */}
                            {task.id === "prd" &&
                              task.status === "done" &&
                              task.result?.prd && (
                                <div className="mt-2 space-y-1.5">
                                  {task.result.githubPrdUrl && (
                                    <a
                                      href={task.result.githubPrdUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                    >
                                      <ExternalLink className="h-3 w-3 shrink-0" />
                                      PRD.md committed to GitHub
                                    </a>
                                  )}
                                  {task.result.jiraUpdated &&
                                    task.result.jiraIssueKey && (
                                      <p className="text-xs text-green-600 font-medium">
                                        {task.result.jiraIssueKey} moved to In
                                        Progress
                                      </p>
                                    )}
                                  <button
                                    onClick={() => setPrdExpanded(!prdExpanded)}
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                  >
                                    {prdExpanded ? (
                                      <ChevronUp className="h-3 w-3" />
                                    ) : (
                                      <ChevronDown className="h-3 w-3" />
                                    )}
                                    {prdExpanded ? "Hide PRD" : "View PRD"}
                                  </button>
                                  {prdExpanded && (
                                    <div className="mt-2 p-4 bg-gray-50 rounded-md border border-gray-200 text-xs text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto font-mono leading-relaxed">
                                      {task.result.prd}
                                    </div>
                                  )}
                                </div>
                              )}

                            {/* Error */}
                            {task.status === "error" && task.result?.error && (
                              <p className="mt-1 text-xs text-red-600">
                                {task.result.error}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  <div className="pt-2 border-t border-gray-100">
                    <button
                      onClick={() =>
                        runAccordion("item-1", ["jira", "github", "prd"])
                      }
                      disabled={!!runningAccordion}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {runningAccordion === "item-1" && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      )}
                      Run Tasks
                    </button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ── AI Architect ── */}
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg font-semibold">
                AI Architect
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  {tasks
                    .filter(
                      (t) => t.id === "architect_jira" || t.id === "architecture" || t.id === "techstack",
                    )
                    .map((task) => (
                      <div key={task.id} className="space-y-2">
                        <div className="flex items-start gap-3">
                          <StatusIcon status={task.status} />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm leading-snug ${
                                task.status === "pending"
                                  ? "text-gray-600"
                                  : "text-gray-800 font-medium"
                              }`}
                            >
                              {task.label}
                              {task.id === "techstack" &&
                                task.status === "pending" && (
                                  <span className="ml-1.5 text-xs text-gray-400 font-normal"></span>
                                )}
                            </p>

                            {/* Architect Jira result */}
                            {task.id === "architect_jira" &&
                              task.status === "done" && (
                                <div className="mt-1">
                                  {task.result?.architectJiraUpdated && task.result.architectJiraIssueKey ? (
                                    <p className="text-xs text-green-600 font-medium">
                                      {task.result.architectJiraIssueKey} moved to In Progress
                                    </p>
                                  ) : (
                                    <p className="text-xs text-gray-500">Jira updated</p>
                                  )}
                                </div>
                              )}

                            {/* Architecture result */}
                            {task.id === "architecture" &&
                              task.status === "done" &&
                              task.result?.architectureContent && (
                                <div className="mt-2 space-y-1.5">
                                  {task.result.githubArchitectureUrl && (
                                    <a
                                      href={task.result.githubArchitectureUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                    >
                                      <ExternalLink className="h-3 w-3 shrink-0" />
                                      ARCHITECTURE.md committed to GitHub
                                    </a>
                                  )}
                                  <button
                                    onClick={() =>
                                      setArchitectureExpanded(
                                        !architectureExpanded,
                                      )
                                    }
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                  >
                                    {architectureExpanded ? (
                                      <ChevronUp className="h-3 w-3" />
                                    ) : (
                                      <ChevronDown className="h-3 w-3" />
                                    )}
                                    {architectureExpanded
                                      ? "Hide Architecture"
                                      : "View Architecture"}
                                  </button>
                                  {architectureExpanded && (
                                    <div className="mt-2 p-4 bg-gray-50 rounded-md border border-gray-200 text-xs text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto font-mono leading-relaxed">
                                      {task.result.architectureContent}
                                    </div>
                                  )}
                                </div>
                              )}

                            {/* Tech Stack result */}
                            {task.id === "techstack" &&
                              task.status === "done" &&
                              task.result?.techStackContent && (
                                <div className="mt-2 space-y-1.5">
                                  {task.result.githubTechStackUrl && (
                                    <a
                                      href={task.result.githubTechStackUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                    >
                                      <ExternalLink className="h-3 w-3 shrink-0" />
                                      TECH_STACK.md committed to GitHub
                                    </a>
                                  )}
                                  <button
                                    onClick={() =>
                                      setTechStackExpanded(!techStackExpanded)
                                    }
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                  >
                                    {techStackExpanded ? (
                                      <ChevronUp className="h-3 w-3" />
                                    ) : (
                                      <ChevronDown className="h-3 w-3" />
                                    )}
                                    {techStackExpanded
                                      ? "Hide Tech Stack"
                                      : "View Tech Stack"}
                                  </button>
                                  {techStackExpanded && (
                                    <div className="mt-2 p-4 bg-gray-50 rounded-md border border-gray-200 text-xs text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto font-mono leading-relaxed">
                                      {task.result.techStackContent}
                                    </div>
                                  )}
                                </div>
                              )}

                            {/* Error */}
                            {task.status === "error" && task.result?.error && (
                              <p className="mt-1 text-xs text-red-600">
                                {task.result.error}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  <div className="pt-2 border-t border-gray-100">
                    <button
                      onClick={() =>
                        runAccordion("item-2", ["architect_jira", "architecture", "techstack"])
                      }
                      disabled={!!runningAccordion}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {runningAccordion === "item-2" && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      )}
                      Run Tasks
                    </button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ── AI Developer ── */}
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg font-semibold">
                AI Developer
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <p className="text-gray-700">
                    The AI Developer has implemented the core functionality and
                    features of your application.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-semibold mb-2">Key Deliverables:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>Source Code Implementation</li>
                      <li>Component Library</li>
                      <li>Integration Tests</li>
                      <li>Code Documentation</li>
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <button
                      onClick={() => runAccordion("item-3", ["github"])}
                      disabled={!!runningAccordion}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {runningAccordion === "item-3" && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      )}
                      Run Tasks
                    </button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ── AI QA Engineer ── */}
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-lg font-semibold">
                AI QA Engineer
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <p className="text-gray-700">
                    The AI QA Engineer has performed comprehensive testing to
                    ensure quality and reliability.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-semibold mb-2">Key Deliverables:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>Test Plan and Test Cases</li>
                      <li>Automated Test Scripts</li>
                      <li>Bug Reports and Resolution</li>
                      <li>Quality Assurance Report</li>
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <button
                      disabled
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-black text-white rounded-md opacity-40 cursor-not-allowed"
                    >
                      Run Tasks
                    </button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ── AI DevOps Engineer ── */}
            <AccordionItem value="item-5">
              <AccordionTrigger className="text-lg font-semibold">
                AI DevOps Engineer
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <p className="text-gray-700">
                    The AI DevOps Engineer has set up the deployment pipeline
                    and infrastructure.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-semibold mb-2">Key Deliverables:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>CI/CD Pipeline Configuration</li>
                      <li>Infrastructure as Code (IaC)</li>
                      <li>Monitoring and Logging Setup</li>
                      <li>Deployment Documentation</li>
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <button
                      disabled
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-black text-white rounded-md opacity-40 cursor-not-allowed"
                    >
                      Run Tasks
                    </button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      {/* Workflow tab */}
      {activeTab === "workflow" && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm min-h-96" />
      )}

      {/* Continue button — shown only after all tasks settle */}
      {allDone && (
        <div className="flex justify-end">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-black text-white font-semibold rounded-md hover:bg-gray-800 transition-colors"
          >
            Continue to Deployment
          </button>
        </div>
      )}
    </div>
  );
}
