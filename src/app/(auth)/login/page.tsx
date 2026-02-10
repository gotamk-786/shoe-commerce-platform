"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { authenticate, buildGoogleAuthUrl, handleApiError } from "@/lib/api";
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

  const googleIcon = (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M23.64 12.204c0-.786-.07-1.54-.2-2.27H12v4.296h6.52a5.58 5.58 0 0 1-2.42 3.66v3.03h3.92c2.29-2.11 3.62-5.22 3.62-8.716Z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.92-3.03c-1.08.73-2.46 1.16-4.03 1.16-3.11 0-5.74-2.1-6.68-4.92H1.28v3.1A12 12 0 0 0 12 24Z"
        fill="#34A853"
      />
      <path
        d="M5.32 14.3A7.2 7.2 0 0 1 4.94 12c0-.8.14-1.57.38-2.3V6.6H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l4.04-3.1Z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.78c1.76 0 3.34.6 4.58 1.8l3.43-3.43C17.96 1.14 15.24 0 12 0 7.3 0 3.24 2.69 1.28 6.6l4.04 3.1c.94-2.82 3.57-4.92 6.68-4.92Z"
        fill="#EA4335"
      />
    </svg>
  );

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
          <Button
            type="button"
            variant="ghost"
            full
            icon={googleIcon}
            className="justify-start gap-3"
            onClick={() => {
              window.location.href = buildGoogleAuthUrl(`${window.location.origin}/auth/google/callback`);
            }}
          >
            Continue with Google
          </Button>
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
