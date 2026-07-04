import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard – JobFusion",
  description: "Internal admin panel",
  robots: "noindex, nofollow",
};

function getAdminIds(): string[] {
  return (process.env.ADMIN_USER_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const adminIds = getAdminIds();

  // Not logged in or not an admin → send to home
  if (!userId || !adminIds.includes(userId)) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
