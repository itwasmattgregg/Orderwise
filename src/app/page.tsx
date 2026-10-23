import Link from "next/link";
import { redirect } from "next/navigation";
import { demoLoginAction } from "./actions";
import { getSessionUser } from "@/lib/session";

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <div className="font-display text-xl font-semibold tracking-tight">
          Order<em className="not-italic text-ink-muted font-medium">wise</em>
        </div>
        <Link
          href="/login"
          className="rounded-xl bg-crust px-4 py-2 text-sm font-semibold text-flour"
        >
          Sign in
        </Link>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 pb-20 pt-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
          Standing orders · both sides
        </p>
        <h1 className="font-display max-w-2xl text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
          Orderwise
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-muted">
          Bring your own products. Share one agreement — quantities, messages, assortment,
          and simple counts — for bakery drops to coffee shops.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <form action={demoLoginAction}>
            <input type="hidden" name="email" value="maya@cafeluna.test" />
            <button
              type="submit"
              className="rounded-xl bg-crust px-5 py-3 text-sm font-semibold text-flour"
            >
              Try as Cafe Luna
            </button>
          </form>
          <form action={demoLoginAction}>
            <input type="hidden" name="email" value="owen@rivertown.test" />
            <button
              type="submit"
              className="rounded-xl border border-rule bg-flour px-5 py-3 text-sm font-semibold text-ink"
            >
              Try as Rivertown Bakery
            </button>
          </form>
        </div>
        <p className="mt-6 text-sm text-ink-muted">
          Demo passwords: <code className="text-ink">demo</code> · run{" "}
          <code className="text-ink">pnpm db:seed</code> if logins fail.
        </p>
      </section>
    </main>
  );
}
