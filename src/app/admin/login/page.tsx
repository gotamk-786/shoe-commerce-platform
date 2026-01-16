"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { useAppDispatch } from "@/store/hooks";
import { adminLogin } from "@/store/slices/admin-slice";

const ADMIN_USER = process.env.NEXT_PUBLIC_ADMIN_USER || "admin@thrifty.com";
const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASS || "admin123";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (email === ADMIN_USER && password === ADMIN_PASS) {
      dispatch(adminLogin({ name: email }));
      router.push("/admin/dashboard");
    } else {
      setError("Invalid admin credentials");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4">
      <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 shadow-[0_30px_80px_rgba(12,22,44,0.12)]">
        <p className="pill mb-3 inline-block text-gray-700">Admin Panel</p>
        <h1 className="text-2xl font-semibold text-gray-900">Admin login</h1>
        <p className="mt-2 text-sm text-gray-600">
          Use the preconfigured credentials to enter the admin dashboard.
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
          <Button type="submit" variant="primary" full>
            Log in
          </Button>
        </form>
        <div className="mt-4 text-xs text-gray-500">
          Default: {ADMIN_USER} / {ADMIN_PASS}
        </div>
      </div>
    </div>
  );
}
