import { withAuth } from "@workos-inc/authkit-nextjs";
import Anthropic from "@anthropic-ai/sdk";
import {
  getProjectRecord,
  getJiraIntegration,
  getGithubIntegration,
  getSlackIntegration,
} from "@/lib/supabase";
import {
  getGithubInstallationToken,
  getInstallationRepos,
} from "@/lib/github";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const { user } = await withAuth();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { task, projectId, jiraResult, githubResult } = await request.json();
  if (!task || !projectId) {
    return Response.json({ error: "Missing task or projectId" }, { status: 400 });
  }

  let project;
  try {
    project = await getProjectRecord(projectId);
    if (project.user_id !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  // ─── Task: Create Jira User Stories ───────────────────────────────────────
  if (task === "jira") {
    const jira = await getJiraIntegration(user.id);
    if (!jira) {
      return Response.json(
        { error: "Jira not connected. Please connect Jira in Settings." },
        { status: 400 }
      );
    }

    // Generate user stories with Claude — one per AI agent role
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Generate exactly 5 Jira user stories for this project — one for each AI agent role listed below. Each story describes the work that specific agent will perform.

Roles: AI Product Manager, AI Architect, AI Developer, AI QA Engineer, AI DevOps Engineer

Project: ${project.project_name}
Requirements: ${project.given_requirements}

Return ONLY a valid JSON array. No markdown, no explanation.
[
  { "summary": "<short title max 100 chars>", "description": "<2-3 sentences describing the agent's work>" },
  ...
]`,
        },
      ],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text : "[]";
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let stories: { summary: string; description: string }[];
    try {
      stories = JSON.parse(cleaned);
    } catch {
      return Response.json(
        { error: "Failed to parse Claude response for user stories" },
        { status: 500 }
      );
    }

    const siteUrl = jira.site_url || "https://olympusss.atlassian.net";
    const projectKey = jira.project_key || "ADB";
    const boardId = jira.board_id || 2;
    const cloudId = jira.cloud_id;

    // OAuth 2.0 tokens must use api.atlassian.com, not the site URL directly
    const apiBase = cloudId
      ? `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3`
      : `${siteUrl}/rest/api/3`;

    const authHeaders = {
      Authorization: `Bearer ${jira.access_token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    // Discover available issue types so we don't hardcode "Story"
    let issueTypeName = "Story";
    try {
      const typesRes = await fetch(
        `${apiBase}/project/${projectKey}`,
        { headers: authHeaders }
      );
      if (typesRes.ok) {
        const projectMeta = await typesRes.json();
        const types: string[] = (projectMeta.issueTypes ?? []).map(
          (t: { name: string }) => t.name
        );
        if (types.length > 0 && !types.includes("Story")) {
          issueTypeName = types.find((t) => t === "Task") ?? types[0];
        }
      }
    } catch {
      // keep default
    }

    const created: { key: string; summary: string }[] = [];
    let lastError: string | null = null;

    for (const story of stories.slice(0, 10)) {
      const res = await fetch(`${apiBase}/issue`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          fields: {
            project: { key: projectKey },
            summary: story.summary,
            description: {
              type: "doc",
              version: 1,
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: story.description }],
                },
              ],
            },
            issuetype: { name: issueTypeName },
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        created.push({ key: data.key, summary: story.summary });
      } else {
        const errBody = await res.json().catch(() => ({ message: res.statusText }));
        lastError = `${res.status}: ${errBody?.errors ? JSON.stringify(errBody.errors) : errBody?.errorMessages?.join(", ") || errBody?.message || res.statusText}`;
        console.error("[Jira] Issue creation failed:", lastError, errBody);
      }
    }

    if (created.length === 0 && lastError) {
      return Response.json(
        { error: `Jira issue creation failed — ${lastError}` },
        { status: 400 }
      );
    }

    // Notify Slack if connected
    const slack = await getSlackIntegration(user.id);
    if (slack && created.length > 0) {
      await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${slack.bot_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: "#general",
          text: `✅ *${project.project_name}* — ${created.length} Jira user stories created in project *${projectKey}*`,
        }),
      }).catch(() => {}); // Slack notification is best-effort
    }

    return Response.json({
      success: true,
      issues: created,
      siteUrl,
      projectKey,
      boardUrl: `${siteUrl}/jira/software/projects/${projectKey}/boards/${boardId}`,
    });
  }

  // ─── Task: Create GitHub Repository ───────────────────────────────────────
  if (task === "github") {
    const github = await getGithubIntegration(user.id);
    if (!github) {
      return Response.json(
        { error: "GitHub not connected. Please connect GitHub in Settings." },
        { status: 400 }
      );
    }

    const repoName = project.project_name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100);

    const repoBody = JSON.stringify({
      name: repoName,
      description: `${project.project_name} — generated by OlympusAI`,
      private: false,
      auto_init: true,
    });

    // If a PAT is configured use it — it can create user repos directly.
    // Installation tokens (server-to-server) cannot create user-namespace repos.
    const pat = process.env.GITHUB_PAT;

    let owner: string | null = null;
    let installationToken: string | null = null;

    if (!pat) {
      // Fall back to installation token + org endpoint
      try {
        installationToken = await getGithubInstallationToken(github.installation_id);
        const repos = await getInstallationRepos(github.installation_id);
        if (repos.length > 0) {
          owner = repos[0].full_name.split("/")[0];
        }
      } catch {
        // proceed
      }
    }

    const activeToken = pat ?? installationToken ?? "";

    const headers = {
      Authorization: `token ${activeToken}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    // PAT → user/repos works. Installation token → orgs/{org}/repos only.
    const endpoints: string[] = pat
      ? ["https://api.github.com/user/repos"]
      : owner
      ? [`https://api.github.com/orgs/${owner}/repos`]
      : ["https://api.github.com/user/repos"];

    let repoData: any = null;
    const attemptErrors: string[] = [];

    for (const url of endpoints) {
      const res = await fetch(url, { method: "POST", headers, body: repoBody });
      const body = await res.json();

      if (res.ok) {
        repoData = body;
        break;
      }

      // Repo already exists — fetch it instead of failing
      if (res.status === 422 && JSON.stringify(body).includes("already exists")) {
        const ownerForFetch = owner ?? "unknown";
        const fetchRes = await fetch(
          `https://api.github.com/repos/${ownerForFetch}/${repoName}`,
          { headers }
        );
        if (fetchRes.ok) {
          repoData = await fetchRes.json();
          break;
        }
      }

      const msg = body?.message ?? res.statusText;
      const detail = body?.errors?.map((e: any) => e.message).join(", ") ?? "";
      attemptErrors.push(`[${url}] ${res.status}: ${msg}${detail ? ` — ${detail}` : ""}`);
      console.error("[GitHub] Repo creation failed:", url, res.status, body);
    }

    if (!repoData) {
      return Response.json(
        { error: `GitHub repo creation failed: ${attemptErrors.join(" | ")}` },
        { status: 400 }
      );
    }

    // Notify Slack if connected
    const slack = await getSlackIntegration(user.id);
    if (slack) {
      await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${slack.bot_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: "#general",
          text: `✅ *${project.project_name}* — GitHub repository created: ${repoData.html_url}`,
        }),
      }).catch(() => {});
    }

    return Response.json({
      success: true,
      repoUrl: repoData.html_url,
      repoName: repoData.full_name,
    });
  }

  // ─── Task: Create PRD ─────────────────────────────────────────────────────
  if (task === "prd") {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `You are an expert Product Manager. Write a comprehensive Product Requirements Document (PRD) in clean markdown.

Project: ${project.project_name}
Priority: ${project.prioritization}
Documentation Depth: ${project.documentation_depth}
Requirements: ${project.given_requirements}${
            project.meeting_transcript
              ? `\nMeeting Transcript:\n${project.meeting_transcript}`
              : ""
          }

Structure:
# ${project.project_name} — PRD

## 1. Executive Summary
## 2. Problem Statement
## 3. Goals & Success Metrics
## 4. Target Users
## 5. Functional Requirements
## 6. Non-Functional Requirements
## 7. Out of Scope
## 8. Technical Considerations
## 9. Timeline & Milestones

Be specific and actionable. Base everything on the requirements provided.`,
        },
      ],
    });

    const prd = msg.content[0].type === "text" ? msg.content[0].text : "";
    let githubPrdUrl: string | undefined;
    let jiraUpdated = false;

    // ── Commit PRD.md to the GitHub repo ──────────────────────────────────
    const repoFullName: string | undefined = githubResult?.repoName;
    if (repoFullName) {
      const pat = process.env.GITHUB_PAT;
      const ghToken = pat ?? (await getGithubInstallationToken(
        (await getGithubIntegration(user.id))?.installation_id ?? ""
      ).catch(() => ""));

      if (ghToken) {
        const prdBase64 = Buffer.from(prd).toString("base64");
        const commitRes = await fetch(
          `https://api.github.com/repos/${repoFullName}/contents/PRD.md`,
          {
            method: "PUT",
            headers: {
              Authorization: `token ${ghToken}`,
              "Content-Type": "application/json",
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
            },
            body: JSON.stringify({
              message: "docs: Add Product Requirements Document (PRD)",
              content: prdBase64,
            }),
          }
        );
        if (commitRes.ok) {
          const commitData = await commitRes.json();
          githubPrdUrl = commitData?.content?.html_url;
        } else {
          console.error("[PRD] GitHub commit failed:", await commitRes.text());
        }
      }
    }

    // ── Update AI PM Jira issue → In Progress + add PRD comment ───────────
    const jiraIssues: { key: string; summary: string }[] = jiraResult?.issues ?? [];
    const pmIssue = jiraIssues.find((i) =>
      /product.?manager/i.test(i.summary)
    ) ?? jiraIssues[0];

    if (pmIssue) {
      const jira = await getJiraIntegration(user.id);
      if (jira) {
        const siteUrl = jira.site_url || "https://olympusss.atlassian.net";
        const cloudId = jira.cloud_id;
        const apiBase = cloudId
          ? `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3`
          : `${siteUrl}/rest/api/3`;
        const authHeaders = {
          Authorization: `Bearer ${jira.access_token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        };

        // Get available transitions and find "In Progress"
        const transRes = await fetch(
          `${apiBase}/issue/${pmIssue.key}/transitions`,
          { headers: authHeaders }
        );
        if (transRes.ok) {
          const { transitions } = await transRes.json();
          const inProgress = (transitions as { id: string; name: string }[]).find(
            (t) => /in.?progress|start/i.test(t.name)
          );
          if (inProgress) {
            await fetch(`${apiBase}/issue/${pmIssue.key}/transitions`, {
              method: "POST",
              headers: authHeaders,
              body: JSON.stringify({ transition: { id: inProgress.id } }),
            });
            jiraUpdated = true;
          }
        }

        // Add PRD as a comment (first 3000 chars to stay within limits)
        const prdSnippet = prd.length > 3000 ? prd.slice(0, 3000) + "\n\n_(truncated — see PRD.md in GitHub)_" : prd;
        const commentText = githubPrdUrl
          ? `PRD committed to GitHub: ${githubPrdUrl}\n\n---\n\n${prdSnippet}`
          : prdSnippet;

        await fetch(`${apiBase}/issue/${pmIssue.key}/comment`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            body: {
              type: "doc",
              version: 1,
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: commentText }],
                },
              ],
            },
          }),
        });
      }
    }

    // ── Slack notification ─────────────────────────────────────────────────
    const slack = await getSlackIntegration(user.id);
    if (slack) {
      await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${slack.bot_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: "#general",
          text: `✅ *${project.project_name}* — PRD generated${githubPrdUrl ? `, committed to GitHub: ${githubPrdUrl}` : ""}${jiraUpdated ? `, and Jira ticket ${pmIssue?.key} moved to In Progress` : ""}.`,
        }),
      }).catch(() => {});
    }

    return Response.json({ success: true, prd, githubPrdUrl, jiraUpdated, jiraIssueKey: pmIssue?.key });
  }

  // ─── Task: Update Jira for AI Architect ───────────────────────────────────
  if (task === "architect_jira") {
    const jira = await getJiraIntegration(user.id);
    if (!jira) {
      return Response.json(
        { error: "Jira not connected. Please connect Jira in Settings." },
        { status: 400 }
      );
    }

    const jiraIssues: { key: string; summary: string }[] = jiraResult?.issues ?? [];
    const architectIssue = jiraIssues.find((i) => /architect/i.test(i.summary)) ?? jiraIssues[1];

    if (!architectIssue) {
      return Response.json(
        { error: "No Architect Jira issue found. Run the Jira task first." },
        { status: 400 }
      );
    }

    const siteUrl = jira.site_url || "https://olympusss.atlassian.net";
    const cloudId = jira.cloud_id;
    const apiBase = cloudId
      ? `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3`
      : `${siteUrl}/rest/api/3`;
    const authHeaders = {
      Authorization: `Bearer ${jira.access_token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    let architectJiraUpdated = false;

    // Move to In Progress
    const transRes = await fetch(
      `${apiBase}/issue/${architectIssue.key}/transitions`,
      { headers: authHeaders }
    );
    if (transRes.ok) {
      const { transitions } = await transRes.json();
      const inProgress = (transitions as { id: string; name: string }[]).find(
        (t) => /in.?progress|start/i.test(t.name)
      );
      if (inProgress) {
        await fetch(`${apiBase}/issue/${architectIssue.key}/transitions`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ transition: { id: inProgress.id } }),
        });
        architectJiraUpdated = true;
      }
    }

    // Add a comment
    await fetch(`${apiBase}/issue/${architectIssue.key}/comment`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        body: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: `AI Architect has started work on ${project.project_name}. System Architecture and Technology Stack documents are being generated.`,
                },
              ],
            },
          ],
        },
      }),
    });

    return Response.json({
      success: true,
      architectJiraUpdated,
      architectJiraIssueKey: architectIssue.key,
    });
  }

  // ─── Task: System Architecture ────────────────────────────────────────────
  if (task === "architecture") {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `You are an expert Software Architect. Write a comprehensive System Architecture document in clean markdown for the following project.

Project: ${project.project_name}
Requirements: ${project.given_requirements}

Structure the document exactly as:
# ${project.project_name} — System Architecture

## 1. Overview
## 2. Architecture Diagram (describe as ASCII or text diagram)
## 3. Core Components
## 4. Data Flow
## 5. Database Schema
## 6. API Design
## 7. Security Considerations
## 8. Scalability & Performance

Be specific and tie every section back to the project requirements.`,
        },
      ],
    });

    const architectureContent = msg.content[0].type === "text" ? msg.content[0].text : "";
    let githubArchitectureUrl: string | undefined;

    const github = await getGithubIntegration(user.id);
    if (github) {
      const pat = process.env.GITHUB_PAT;
      const ghToken = pat ?? (await getGithubInstallationToken(github.installation_id).catch(() => ""));

      if (ghToken) {
        // Find existing repo by deriving the same slug used during repo creation
        const repoName = project.project_name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 100);

        const repos = await getInstallationRepos(github.installation_id).catch(() => []);
        const matchedRepo = repos.find((r: { name: string; full_name: string }) => r.name === repoName);
        const repoFullName = matchedRepo?.full_name;

        if (repoFullName) {
          const commitRes = await fetch(
            `https://api.github.com/repos/${repoFullName}/contents/ARCHITECTURE.md`,
            {
              method: "PUT",
              headers: {
                Authorization: `token ${ghToken}`,
                "Content-Type": "application/json",
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
              },
              body: JSON.stringify({
                message: "docs: Add System Architecture document",
                content: Buffer.from(architectureContent).toString("base64"),
              }),
            }
          );
          if (commitRes.ok) {
            const commitData = await commitRes.json();
            githubArchitectureUrl = commitData?.content?.html_url;
          } else {
            console.error("[Architecture] GitHub commit failed:", await commitRes.text());
          }
        }
      }
    }

    return Response.json({ success: true, architectureContent, githubArchitectureUrl });
  }

  // ─── Task: Technology Stack Recommendations ────────────────────────────────
  if (task === "techstack") {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are an expert Software Architect. Write a Technology Stack Recommendations document in clean markdown.

The frontend is ALWAYS React (web app). Choose the best supporting technologies around it based on the project.

Project: ${project.project_name}
Requirements: ${project.given_requirements}

Structure the document exactly as:
# ${project.project_name} — Technology Stack

## Frontend
- **Framework:** React (Web App)
- [add libraries, state management, styling, etc.]

## Backend
## Database
## Infrastructure & DevOps
## Third-Party Services
## Rationale

Keep each section concise and tie choices to the requirements.`,
        },
      ],
    });

    const techStackContent = msg.content[0].type === "text" ? msg.content[0].text : "";
    let githubTechStackUrl: string | undefined;

    const github = await getGithubIntegration(user.id);
    if (github) {
      const pat = process.env.GITHUB_PAT;
      const ghToken = pat ?? (await getGithubInstallationToken(github.installation_id).catch(() => ""));

      if (ghToken) {
        const repoName = project.project_name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 100);

        const repos = await getInstallationRepos(github.installation_id).catch(() => []);
        const matchedRepo = repos.find((r: { name: string; full_name: string }) => r.name === repoName);
        const repoFullName = matchedRepo?.full_name;

        if (repoFullName) {
          const commitRes = await fetch(
            `https://api.github.com/repos/${repoFullName}/contents/TECH_STACK.md`,
            {
              method: "PUT",
              headers: {
                Authorization: `token ${ghToken}`,
                "Content-Type": "application/json",
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
              },
              body: JSON.stringify({
                message: "docs: Add Technology Stack Recommendations",
                content: Buffer.from(techStackContent).toString("base64"),
              }),
            }
          );
          if (commitRes.ok) {
            const commitData = await commitRes.json();
            githubTechStackUrl = commitData?.content?.html_url;
          } else {
            console.error("[TechStack] GitHub commit failed:", await commitRes.text());
          }
        }
      }
    }

    return Response.json({ success: true, techStackContent, githubTechStackUrl });
  }

  return Response.json({ error: `Unknown task: ${task}` }, { status: 400 });
}
