import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import {
  confirmPendingQtyAction,
  markDeliveredAction,
  sendMessageAction,
  skipDeliveryAction,
} from "@/app/actions";
import { AppHeader } from "@/components/AppHeader";
import { InventoryPanel } from "@/components/InventoryPanel";
import { DeliveryPanel } from "@/components/DeliveryPanel";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { getSessionUser, orgRoleForUser } from "@/lib/session";

export default async function AgreementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const agreement = await prisma.agreement.findUnique({
    where: { id },
    include: {
      supplierOrg: true,
      buyerOrg: true,
      assortment: { include: { product: true }, orderBy: { product: { name: "asc" } } },
      deliveries: {
        include: {
          lines: {
            include: { assortmentItem: { include: { product: true } } },
            orderBy: { assortmentItem: { product: { name: "asc" } } },
          },
        },
        orderBy: { date: "asc" },
      },
      activities: {
        include: {
          author: { include: { memberships: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 50,
      },
    },
  });
  if (!agreement) notFound();

  const role = orgRoleForUser(user, agreement);
  if (!role) redirect("/dashboard");

  const myOrgId = role === "supplier" ? agreement.supplierOrgId : agreement.buyerOrgId;
  const inventory = await prisma.inventoryItem.findMany({
    where: { orgId: myOrgId },
    orderBy: { label: "asc" },
  });

  const upcoming =
    agreement.deliveries.find((d) => d.status === "SCHEDULED" || d.status === "CONFIRMED") ??
    agreement.deliveries[agreement.deliveries.length - 1];

  const pendingLines = upcoming?.lines.filter((l) => l.pendingAck) ?? [];

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader
        title={role === "buyer" ? agreement.buyerOrg.name : agreement.supplierOrg.name}
        subtitle={role === "buyer" ? "Cafe view" : "Bakery view"}
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-6">
        <div className="overflow-hidden rounded-[28px] border border-rule bg-flour shadow-[0_18px_50px_rgba(28,25,21,0.08)]">
          <div className="border-b border-rule px-6 py-3 text-[15px] font-semibold tracking-tight">
            Standing <span className="font-medium text-ink-muted">order</span>
            <span className="float-right rounded-lg bg-steam px-2.5 py-1 text-xs font-medium text-crust-soft">
              Viewing as {role === "buyer" ? agreement.buyerOrg.name : agreement.supplierOrg.name}
            </span>
          </div>

          <section className="px-6 pb-2 pt-7">
            <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-2">
              <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                {agreement.buyerOrg.name}
              </h1>
              <span className="font-display text-2xl font-medium text-ink-muted md:text-3xl">↔</span>
              <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                {agreement.supplierOrg.name}
              </h1>
            </div>
            <div className="mt-3 mb-4 flex flex-wrap gap-x-3.5 gap-y-2 text-sm text-ink-muted">
              <span>
                <b className="font-semibold text-ink">Cadence</b> {agreement.cadenceLabel}
              </span>
              <span>
                <b className="font-semibold text-ink">Settlement</b>{" "}
                {agreement.settlement === "MANUAL" ? "Manual invoice" : agreement.settlement}
              </span>
              <span>
                <b className="font-semibold text-ink">Cutoff</b> {agreement.cutoffLabel}
              </span>
            </div>
            <div
              className={`mb-2 flex items-center gap-3 rounded-[14px] border px-3.5 py-3 text-sm ${
                pendingLines.length
                  ? "border-ember/30 bg-gradient-to-r from-ember-soft/60 to-steam/60"
                  : "border-butter/30 bg-gradient-to-r from-butter/15 to-steam/60"
              }`}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  pendingLines.length ? "bg-ember" : "bg-butter"
                }`}
              />
              {pendingLines.length ? (
                <span>
                  <b>Past cutoff</b> · change needs {agreement.supplierOrg.name} confirm
                </span>
              ) : (
                <span>
                  <b>Editable</b> until cutoff · next drop{" "}
                  {upcoming ? format(upcoming.date, "EEE MMM d") : "—"}
                </span>
              )}
            </div>
          </section>

          {pendingLines.length > 0 && role === "supplier" ? (
            <div className="mx-6 mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-ember/25 bg-ember-soft px-4 py-3.5 text-sm">
              <div>
                <strong>Change requested after cutoff</strong>
                <p className="mt-1 text-ink-muted">
                  {pendingLines
                    .map(
                      (l) =>
                        `${l.assortmentItem.product.name} ${l.qty} → ${l.requestedQty ?? "?"}`,
                    )
                    .join(" · ")}
                </p>
              </div>
              <div className="flex gap-2">
                {pendingLines.map((l) => (
                  <form key={l.id} action={confirmPendingQtyAction}>
                    <input type="hidden" name="agreementId" value={agreement.id} />
                    <input type="hidden" name="lineId" value={l.id} />
                    <button
                      type="submit"
                      className="rounded-xl bg-crust px-4 py-2 text-sm font-semibold text-flour"
                    >
                      Confirm
                    </button>
                  </form>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-2 grid md:grid-cols-[1.15fr_0.85fr]">
            <section className="border-rule px-6 py-5 md:border-r">
              <div className="mb-3 flex items-end justify-between gap-3">
                <h2 className="font-display text-[22px] font-semibold tracking-tight">
                  Next drop
                  {upcoming ? ` · ${format(upcoming.date, "EEE")}` : ""}
                </h2>
                {role === "supplier" && upcoming?.status === "SCHEDULED" ? (
                  <form action={markDeliveredAction}>
                    <input type="hidden" name="agreementId" value={agreement.id} />
                    <input type="hidden" name="deliveryId" value={upcoming.id} />
                    <button
                      type="submit"
                      className="rounded-xl bg-sage px-3 py-2 text-sm font-semibold text-white"
                    >
                      Mark delivered
                    </button>
                  </form>
                ) : null}
              </div>

              <div className="mb-4 flex w-fit gap-1 overflow-x-auto rounded-xl bg-steam p-1">
                {agreement.deliveries.map((d) => {
                  const selected = d.id === upcoming?.id;
                  return (
                    <div
                      key={d.id}
                      className={`rounded-[9px] px-3.5 py-2 text-center text-[13px] font-medium ${
                        selected ? "bg-flour text-ink shadow-sm" : "text-ink-muted"
                      }`}
                    >
                      {format(d.date, "EEE")}
                      <span className="mt-0.5 block text-[10px] opacity-70">
                        {d.status === "DELIVERED"
                          ? "done"
                          : d.status === "SKIPPED"
                            ? "skipped"
                            : selected
                              ? "next"
                              : "ahead"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {upcoming ? (
                <DeliveryPanel
                  agreementId={agreement.id}
                  lines={upcoming.lines.map((line) => ({
                    id: line.id,
                    qty: line.qty,
                    pendingAck: line.pendingAck,
                    requestedQty: line.requestedQty,
                    standingQty: line.assortmentItem.standingQty,
                    productName: line.assortmentItem.product.name,
                    unitPriceLabel: `${formatCents(line.assortmentItem.unitPriceCents ?? line.assortmentItem.product.priceCents)} ea`,
                  }))}
                />
              ) : (
                <p className="text-sm text-ink-muted">No deliveries scheduled.</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {upcoming && upcoming.status === "SCHEDULED" ? (
                  <form action={skipDeliveryAction}>
                    <input type="hidden" name="agreementId" value={agreement.id} />
                    <input type="hidden" name="deliveryId" value={upcoming.id} />
                    <button
                      type="submit"
                      className="rounded-xl border border-rule px-4 py-2 text-sm font-semibold"
                    >
                      Skip {upcoming ? format(upcoming.date, "EEE") : ""}
                    </button>
                  </form>
                ) : null}
              </div>

              <div className="mt-6">
                <h3 className="font-display text-lg font-semibold">Assortment</h3>
                <p className="mt-1 text-xs text-ink-muted">
                  What this cafe can ask for — not a marketplace, not stock levels.
                </p>
                <ul className="mt-2 divide-y divide-rule border-t border-rule text-sm">
                  {agreement.assortment.map((a) => (
                    <li key={a.id} className="flex justify-between py-2">
                      <span className="font-medium">{a.product.name}</span>
                      <span className="text-ink-muted">
                        standing {a.standingQty} ·{" "}
                        {formatCents(a.unitPriceCents ?? a.product.priceCents)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <InventoryPanel
                orgId={myOrgId}
                orgName={
                  role === "buyer" ? agreement.buyerOrg.name : agreement.supplierOrg.name
                }
                agreementId={agreement.id}
                items={inventory}
              />
            </section>

            <section className="flex flex-col bg-gradient-to-b from-[#faf7f2] to-flour px-6 py-5">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="font-display text-[22px] font-semibold">Thread</h2>
                <span className="text-xs text-ink-muted">Same truth · both sides</span>
              </div>
              <div className="flex max-h-[480px] flex-1 flex-col gap-3 overflow-y-auto pr-1">
                {agreement.activities.map((act) => {
                  if (act.kind === "SYSTEM") {
                    return (
                      <div key={act.id} className="grid grid-cols-[28px_1fr] gap-2.5 text-[13px] text-ink-muted">
                        <div className="grid h-7 w-7 place-items-center rounded-full bg-steam text-xs text-crust-soft">
                          ↻
                        </div>
                        <div>
                          <span className="text-ink">{act.body}</span>
                          <time className="mt-0.5 block text-[11px] opacity-75">
                            {format(act.createdAt, "EEE h:mma")}
                          </time>
                        </div>
                      </div>
                    );
                  }
                  const isBakeryMsg = !!act.author?.memberships.some(
                    (m) => m.orgId === agreement.supplierOrgId,
                  );

                  return (
                    <div
                      key={act.id}
                      className={`max-w-[92%] rounded-2xl border px-3.5 py-3 text-sm leading-snug ${
                        isBakeryMsg
                          ? "ml-auto rounded-br-md border-crust bg-crust text-flour"
                          : "rounded-bl-md border-rule bg-flour"
                      }`}
                    >
                      <div
                        className={`mb-1 text-[11px] font-semibold uppercase tracking-wide ${
                          isBakeryMsg ? "text-butter-soft" : "text-ink-muted"
                        }`}
                      >
                        {act.author?.name ?? "Unknown"}
                      </div>
                      {act.body}
                    </div>
                  );
                })}
              </div>
              <form action={sendMessageAction} className="mt-3.5 flex gap-2 border-t border-rule pt-3">
                <input type="hidden" name="agreementId" value={agreement.id} />
                <textarea
                  name="body"
                  rows={1}
                  required
                  placeholder="Message about this order…"
                  className="min-h-12 flex-1 resize-none rounded-[14px] border border-rule bg-flour px-3.5 py-3 text-sm outline-none focus:border-butter"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-crust px-4 py-2 text-sm font-semibold text-flour"
                >
                  Send
                </button>
              </form>
            </section>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-ink-muted">
          Tip: after cutoff, cafe qty changes request bakery confirm. Toggle pending by requesting
          a change once a line is already flagged, or ask bakery to confirm.
        </p>
      </main>
    </div>
  );
}
