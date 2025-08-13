import type { Metadata } from "next";
import AdminLoginForm from "./AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 shadow-lg">
        <h1 className="text-xl font-semibold text-white">Admin Login</h1>
        <p className="text-white/60 text-sm mt-1">Enter the admin password to continue.</p>
        <div className="mt-4">
          <AdminLoginForm />
        </div>
        <p className="text-[10px] text-white/40 mt-3">This page is not indexed.</p>
      </div>
    </div>
  );
}
