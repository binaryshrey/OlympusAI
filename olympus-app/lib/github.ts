import jwt from "jsonwebtoken";

// Generate a JWT signed as the GitHub App (valid for 10 minutes)
function generateAppJWT(): string {
  const appId = process.env.GITHUB_APP_ID!;
  // Private key is stored with literal \n in env — convert to real newlines
  const privateKey = process.env.GITHUB_PRIVATE_KEY!.replace(/\\n/g, "\n");

  return jwt.sign(
    {
      iat: Math.floor(Date.now() / 1000) - 60, // issued 60s ago to account for clock skew
      exp: Math.floor(Date.now() / 1000) + 600, // 10 minutes
      iss: appId,
    },
    privateKey,
    { algorithm: "RS256" }
  );
}

// Exchange installation_id for a short-lived access token
export async function getGithubInstallationToken(
  installationId: string
): Promise<string> {
  const appJWT = generateAppJWT();

  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appJWT}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("[GitHub] Failed to get installation token:", err);
    throw new Error("Failed to get GitHub installation token");
  }

  const data = await res.json();
  return data.token; // ghs_xxxx — valid for 1 hour
}

// Fetch repos accessible to the installation
export async function getInstallationRepos(installationId: string) {
  const token = await getGithubInstallationToken(installationId);

  const res = await fetch(
    "https://api.github.com/installation/repositories",
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!res.ok) throw new Error("Failed to fetch GitHub repos");

  const data = await res.json();
  return data.repositories as Array<{
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    default_branch: string;
  }>;
}
