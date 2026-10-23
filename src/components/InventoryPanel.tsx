"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { addInventoryAction, updateInventoryAction } from "@/app/actions";

type Item = {
  id: string;
  label: string;
  qty: number;
  unit: string;
  notes: string | null;
};

export function InventoryPanel({
  orgId,
  orgName,
  agreementId,
  items,
}: {
  orgId: string;
  orgName: string;
  agreementId: string;
  items: Item[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function bump(itemId: string, qty: number) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("orgId", orgId);
      fd.set("itemId", itemId);
      fd.set("qty", String(Math.max(0, qty)));
      fd.set("agreementId", agreementId);
      await updateInventoryAction(fd);
      router.refresh();
    });
  }

  return (
    <section className="mt-6 border-t border-rule pt-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl font-semibold tracking-tight">Simple inventory</h2>
        <span className="text-xs text-ink-muted">{orgName} · not a warehouse</span>
      </div>
      <p className="mb-3 text-xs text-ink-muted">
        Optional counts either side can keep — what you have or need. Separate from the shared
        assortment.
      </p>
      <div className="flex flex-col">
        {items.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-rule py-2.5"
          >
            <div>
              <div className="text-sm font-semibold">{item.label}</div>
              {item.notes ? <div className="text-xs text-ink-muted">{item.notes}</div> : null}
            </div>
            <div className="flex items-center gap-0.5 rounded-xl bg-steam p-1">
              <button
                type="button"
                disabled={pending}
                onClick={() => bump(item.id, item.qty - 1)}
                className="h-8 w-8 rounded-lg bg-flour text-base shadow-sm hover:bg-crust hover:text-flour"
              >
                −
              </button>
              <span className="min-w-10 text-center text-lg font-bold tabular-nums">{item.qty}</span>
              <button
                type="button"
                disabled={pending}
                onClick={() => bump(item.id, item.qty + 1)}
                className="h-8 w-8 rounded-lg bg-flour text-base shadow-sm hover:bg-crust hover:text-flour"
              >
                +
              </button>
              <span className="ml-1 pr-1 text-xs text-ink-muted">{item.unit}</span>
            </div>
          </div>
        ))}
      </div>
      <form
        className="mt-3 flex flex-wrap gap-2"
        action={(fd) => {
          startTransition(async () => {
            await addInventoryAction(fd);
            router.refresh();
          });
        }}
      >
        <input type="hidden" name="orgId" value={orgId} />
        <input type="hidden" name="agreementId" value={agreementId} />
        <input
          name="label"
          required
          placeholder="Add count label…"
          className="min-w-[160px] flex-1 rounded-xl border border-rule bg-flour px-3 py-2 text-sm outline-none focus:border-butter"
        />
        <input
          name="qty"
          type="number"
          min={0}
          defaultValue={0}
          className="w-20 rounded-xl border border-rule bg-flour px-3 py-2 text-sm outline-none focus:border-butter"
        />
        <button
          type="submit"
          className="rounded-xl bg-crust px-3 py-2 text-sm font-semibold text-flour"
        >
          Add
        </button>
      </form>
    </section>
  );
}
