"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { authenticate, handleApiError } from "@/lib/api";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices/user-slice";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{ loading: boolean; error?: string }>({
    loading: false,
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setStatus({ loading: true });
      const response = await authenticate({ email, password });
      dispatch(setCredentials(response));
      setStatus({ loading: false });
      router.push("/account");
    } catch (err) {
      setStatus({ loading: false, error: handleApiError(err) });
    }
  };

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="space-y-8 rounded-3xl border border-black/10 bg-white p-8 shadow-[0_14px_60px_rgba(12,22,44,0.08)]">
        <div>
          <p className="pill mb-2 inline-block">Welcome back</p>
          <h1 className="text-2xl font-semibold text-gray-900">Log in to Thrifty Shoes</h1>
          <p className="mt-2 text-sm text-gray-600">
            Smooth Apple-grade auth UI. JWT handled client-side.
          </p>
        </div>
        <form className="space-y-4" onSubmit={submit}>
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
          {status.error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {status.error}
            </div>
          )}
          <Button type="submit" variant="primary" full disabled={status.loading}>
            Sign in
          </Button>
        </form>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <Link href="/register" className="underline">
            Create account
          </Link>
          <Link href="/forgot-password" className="underline">
            Forgot password
          </Link>
        </div>
      </div>
    </div>
  );
}
