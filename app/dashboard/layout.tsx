import Link from "next/link";
import { signOut } from "./actions";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 text-sm font-semibold text-accent">
              P
            </span>
            <span className="text-sm font-semibold tracking-tight text-neutral-900">
              Proposals
            </span>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-1.5 font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
            >
              Proposals
            </Link>
            <Link
              href="/dashboard/settings"
              className="rounded-lg px-3 py-1.5 font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
            >
              Settings
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="ml-1 rounded-lg px-3 py-1.5 font-medium text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
