import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Project {
  id?: string;
  user_id: string;
  user_email?: string;
  project_name: string;
  jira_id: string;
  target_platform: string;
  intended_users: string;
  description: string;
  duration: string;
  language: string;
  prioritization?: string;
  documentation_depth?: string;
  functional_requirements?: string;
  non_functional_requirements?: string;
  risk_identification?: string;
  chat_summary?: string;
  created_at?: string;
  updated_at?: string;
}

// Create or Update Project
export async function upsertProject(project: Project) {
  const { data, error } = await supabase
    .from("projects")
    .upsert(project, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error("Error upserting project:", error);
    throw error;
  }

  return data;
}

// Get Project by ID
export async function getProject(id: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching project:", error);
    throw error;
  }

  return data;
}

// Get Latest Project by User ID
export async function getLatestProjectByUser(userId: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "not found" error
    console.error("Error fetching latest project:", error);
    throw error;
  }

  return data;
}

// Get All Projects by User ID
export async function getProjectsByUser(userId: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }

  return data;
}

// Jira Integration
export interface JiraIntegration {
  id?: string;
  user_id: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  cloud_id: string;
  site_url: string;
  site_name?: string;
  project_key?: string;
  board_id?: number;
  created_at?: string;
  updated_at?: string;
}

export async function getJiraIntegration(userId: string) {
  const { data, error } = await supabase
    .from("jira_integrations")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching Jira integration:", error);
    throw error;
  }

  return data as JiraIntegration | null;
}

export async function upsertJiraIntegration(integration: JiraIntegration) {
  const { data, error } = await supabase
    .from("jira_integrations")
    .upsert(integration, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    console.error("Error upserting Jira integration:", error);
    throw error;
  }

  return data;
}

// GitHub Integration
export interface GithubIntegration {
  id?: string;
  user_id: string;
  installation_id: string;
  repos?: string[];
  setup_action?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getGithubIntegration(userId: string) {
  const { data, error } = await supabase
    .from("github_integrations")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching GitHub integration:", error);
    throw error;
  }

  return data as GithubIntegration | null;
}

// Slack Integration
export interface SlackIntegration {
  id?: string;
  user_id: string;
  team_id: string;
  team_name?: string;
  bot_token: string;
  bot_user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getSlackIntegration(userId: string) {
  const { data, error } = await supabase
    .from("slack_integrations")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching Slack integration:", error);
    throw error;
  }

  return data as SlackIntegration | null;
}
