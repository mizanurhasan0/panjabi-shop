import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getAdmin, isSetupEnabled, needsAdminSetup } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default async function AdminLoginPage() {
  if (await getAdmin()) redirect("/admin");
  return <LoginForm needsSetup={needsAdminSetup()} setupEnabled={isSetupEnabled()}/>;
}
