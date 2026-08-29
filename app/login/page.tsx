"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, { error: null });

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-lg font-semibold text-accent">
            P
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Sign in
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Proposals dashboard
          </p>
        </div>

        <form
          action={formAction}
          className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-neutral-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent-soft"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-neutral-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent-soft"
            />
          </div>

          {state.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
