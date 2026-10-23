import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const orgIds = user.memberships.map((m) => m.orgId);
  const agreements = await prisma.agreement.findMany({
    where: {
      OR: [{ supplierOrgId: { in: orgIds } }, { buyerOrgId: { in: orgIds } }],
    },
    include: {
      supplierOrg: true,
      buyerOrg: true,
      deliveries: {
        where: { status: { in: ["SCHEDULED", "CONFIRMED"] } },
        orderBy: { date: "asc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const inventory = await prisma.inventoryItem.findMany({
    where: { orgId: { in: orgIds } },
    include: { org: true },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });

  const primaryOrg = user.memberships[0]?.org;

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader title={user.name} subtitle={primaryOrg?.name} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
          Your agreements
        </p>
        <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight">
          Standing orders
        </h1>
        <p className="mt-2 text-ink-muted">
          Signed in as {user.name}
          {primaryOrg ? ` · ${primaryOrg.name}` : ""}. Same shared home for both sides.
        </p>

        <ul className="mt-8 divide-y divide-rule border-t border-rule">
          {agreements.map((a) => {
            const isSupplier = orgIds.includes(a.supplierOrgId);
            const other = isSupplier ? a.buyerOrg.name : a.supplierOrg.name;
            const next = a.deliveries[0];
            return (
              <li key={a.id}>
                <Link
                  href={`/agreements/${a.id}`}
                  className="flex items-center justify-between gap-4 py-4 transition hover:bg-steam/60"
                >
                  <div>
                    <div className="font-semibold tracking-tight">
                      {isSupplier ? (
                        <>
                          {a.buyerOrg.name} <span className="font-medium text-ink-muted">↔ you</span>
                        </>
                      ) : (
                        <>
                          you <span className="font-medium text-ink-muted">↔</span> {other}
                        </>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-ink-muted">
                      {a.cadenceLabel}
                      {next
                        ? ` · next ${next.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`
                        : ""}
                    </div>
                  </div>
                  <span className="rounded-lg bg-steam px-2.5 py-1 text-xs font-semibold text-crust-soft">
                    {a.settlement === "MANUAL" ? "Manual" : a.settlement}
                  </span>
                </Link>
              </li>
            );
          })}
          {agreements.length === 0 ? (
            <li className="py-8 text-sm text-ink-muted">
              No agreements yet. Run <code className="text-ink">pnpm db:seed</code>.
            </li>
          ) : null}
        </ul>

        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold">Your simple inventory</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Lightweight counts for your org — open an agreement to edit.
          </p>
          <ul className="mt-4 divide-y divide-rule border-t border-rule">
            {inventory.map((item) => (
              <li key={item.id} className="flex justify-between py-3 text-sm">
                <span>
                  <span className="font-medium">{item.label}</span>
                  <span className="text-ink-muted"> · {item.org.name}</span>
                </span>
                <span className="font-semibold tabular-nums">
                  {item.qty} {item.unit}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
