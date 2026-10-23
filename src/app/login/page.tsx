import Link from "next/link";
import { loginAction, demoLoginAction } from "../actions";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <Link href="/" className="font-display mb-8 text-xl font-semibold">
        Order<em className="not-italic font-medium text-ink-muted">wise</em>
      </Link>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-ink-muted">Use a demo account or email below.</p>

      <form action={loginAction} className="mt-8 space-y-4">
        <label className="block text-sm font-medium">
          Email
          <input
            name="email"
            type="email"
            required
            defaultValue="maya@cafeluna.test"
            className="mt-1 w-full rounded-xl border border-rule bg-flour px-3 py-2.5 outline-none focus:border-butter"
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input
            name="password"
            type="password"
            required
            defaultValue="demo"
            className="mt-1 w-full rounded-xl border border-rule bg-flour px-3 py-2.5 outline-none focus:border-butter"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-xl bg-crust py-3 text-sm font-semibold text-flour"
        >
          Continue
        </button>
      </form>

      <div className="mt-8 flex flex-col gap-2">
        <form action={demoLoginAction}>
          <input type="hidden" name="email" value="maya@cafeluna.test" />
          <button type="submit" className="w-full rounded-xl border border-rule py-2.5 text-sm font-medium">
            Cafe Luna (Maya)
          </button>
        </form>
        <form action={demoLoginAction}>
          <input type="hidden" name="email" value="owen@rivertown.test" />
          <button type="submit" className="w-full rounded-xl border border-rule py-2.5 text-sm font-medium">
            Rivertown Bakery (Owen)
          </button>
        </form>
      </div>
    </main>
  );
}
