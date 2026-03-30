import { redirect } from "next/navigation";

// Dashboard root redirects to vault
export default function DashboardRoot() {
  redirect("/vault");
}
