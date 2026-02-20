import { redirect } from "next/navigation";

export default async function Meeting() {
  // Redirect to dashboard since we now use /meeting/[id]
  redirect("/dashboard");
}
