import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";
import { verifyAdmin } from "@/lib/admin-auth";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";

export const metadata: Metadata = {
  title: "Admin Dashboard – JobFusion",
  description: "Internal admin operations dashboard",
  robots: "noindex, nofollow",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const mongoUser = await verifyAdmin();

  // If user is not verified as admin, deny access
  if (!mongoUser) {
    redirect("/");
  }

  const clerkUser = await currentUser();
  const adminUser = {
    fullName: mongoUser.fullName || (clerkUser?.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim() : "Admin"),
    email: mongoUser.email || clerkUser?.emailAddresses[0]?.emailAddress || "",
    profileImage: mongoUser.profileImage || clerkUser?.imageUrl || "",
  };

  return (
    <AdminLayoutClient adminUser={adminUser}>
      {children}
    </AdminLayoutClient>
  );
}
