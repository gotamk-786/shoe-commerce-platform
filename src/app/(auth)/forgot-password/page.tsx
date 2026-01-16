"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import Link from "next/link";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { handleApiError, requestPasswordReset } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ loading: boolean; message?: string; error?: string }>({
    loading: false,
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setStatus({ loading: true });
      await requestPasswordReset(email);
      setStatus({
        loading: false,
        message: "If an account exists, reset instructions are on the way.",
      });
    } catch (err) {
      setStatus({ loading: false, error: handleApiError(err) });
    }
  };

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="space-y-8 rounded-3xl border border-black/10 bg-white p-8 shadow-[0_14px_60px_rgba(12,22,44,0.08)]">
        <div>
          <p className="pill mb-2 inline-block">Reset</p>
          <h1 className="text-2xl font-semibold text-gray-900">Forgot password</h1>
          <p className="mt-2 text-sm text-gray-600">
            We'll send a secure reset link through the API endpoint provided by your
            backend.
          </p>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          />
          {status.error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {status.error}
            </div>
          )}
          {status.message && (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {status.message}
            </div>
          )}
          <Button type="submit" variant="primary" full disabled={status.loading}>
            Send reset link
          </Button>
        </form>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <Link href="/login" className="underline">
            Back to login
          </Link>
          <Link href="/register" className="underline">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
