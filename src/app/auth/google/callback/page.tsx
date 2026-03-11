"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices/user-slice";
import { fetchProfile, handleApiError } from "@/lib/api";

function GoogleCallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const dispatch = useAppDispatch();
  const token = params.get("token");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    localStorage.setItem("thrifty_token", token);
    fetchProfile()
      .then((user) => {
        dispatch(setCredentials({ token, user }));
        router.replace("/account");
      })
      .catch((err) => {
        setError(handleApiError(err));
      });
  }, [dispatch, router, token]);

  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <div className="space-y-4 rounded-3xl border border-black/10 bg-white p-8 shadow-[0_14px_60px_rgba(12,22,44,0.08)]">
        <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Google Login</p>
        <h1 className="text-xl font-semibold text-gray-900">Signing you in...</h1>
        {(error || !token) && <p className="text-sm text-red-600">{error || "Google login failed. Missing token."}</p>}
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-6 py-16 text-center">
          <div className="space-y-4 rounded-3xl border border-black/10 bg-white p-8 shadow-[0_14px_60px_rgba(12,22,44,0.08)]">
            <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Google Login</p>
            <h1 className="text-xl font-semibold text-gray-900">Signing you in...</h1>
          </div>
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
