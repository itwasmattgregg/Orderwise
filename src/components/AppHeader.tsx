import Link from "next/link";
import { logoutAction } from "@/app/actions";

export function AppHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="flex items-center justify-between border-b border-rule bg-flour/80 px-5 py-3 backdrop-blur">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="font-display text-[15px] font-semibold tracking-tight">
          Order<em className="not-italic font-medium text-ink-muted">wise</em>
        </Link>
        <div className="hidden text-sm text-ink-muted sm:block">
          <span className="font-medium text-ink">{title}</span>
          {subtitle ? <span> · {subtitle}</span> : null}
        </div>
      </div>
      <form action={logoutAction}>
        <button type="submit" className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-muted hover:text-ink">
          Sign out
        </button>
      </form>
    </header>
  );
}
