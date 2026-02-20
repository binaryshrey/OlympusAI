import { redirect } from "next/navigation";

export default async function Summary() {
  // Redirect to dashboard since we now use /summary/[id]
  redirect("/dashboard");
}
