"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { useAppDispatch } from "@/store/hooks";
import { adminLogin } from "@/store/slices/admin-slice";
import { authenticate, handleApiError } from "@/lib/api";
import { setCredentials } from "@/store/slices/user-slice";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = await authenticate({ email: email.trim().toLowerCase(), password });
      if (payload.user.role !== "admin") {
        setError("This account does not have admin access.");
        return;
      }
      dispatch(setCredentials(payload));
      dispatch(adminLogin({ name: payload.user.name || payload.user.email }));
      router.push("/admin/dashboard");
    } catch (err) {
      setError(handleApiError(err) || "Invalid admin credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4">
      <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 shadow-[0_30px_80px_rgba(12,22,44,0.12)]">
        <p className="pill mb-3 inline-block text-gray-700">Admin Panel</p>
        <h1 className="text-2xl font-semibold text-gray-900">Admin login</h1>
        <p className="mt-2 text-sm text-gray-600">
          Sign in with your admin account to enter the dashboard.
        </p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <Button type="submit" variant="primary" full disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
