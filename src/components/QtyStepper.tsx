"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateDeliveryQtyAction } from "@/app/actions";

export function QtyStepper({
  agreementId,
  lineId,
  initialQty,
  standingQty,
  pastCutoff,
  pendingAck,
  requestedQty,
  productName,
  unitPriceLabel,
}: {
  agreementId: string;
  lineId: string;
  initialQty: number;
  standingQty: number;
  pastCutoff: boolean;
  pendingAck: boolean;
  requestedQty: number | null;
  productName: string;
  unitPriceLabel: string;
}) {
  const [qty, setQty] = useState(initialQty);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const dirty = qty !== initialQty;
  const showOverride = qty !== standingQty || pendingAck;

  function commit(next: number) {
    setQty(next);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("agreementId", agreementId);
      fd.set("lineId", lineId);
      fd.set("qty", String(next));
      fd.set("pastCutoff", pastCutoff ? "true" : "false");
      await updateDeliveryQtyAction(fd);
      router.refresh();
    });
  }

  return (
    <div
      className={`grid grid-cols-[1fr_auto] items-center gap-3 border-b border-rule py-3.5 ${
        pendingAck
          ? "bg-gradient-to-r from-ember-soft/50 to-transparent shadow-[inset_3px_0_0_var(--ember)]"
          : showOverride
            ? "bg-gradient-to-r from-butter-soft/40 to-transparent shadow-[inset_3px_0_0_var(--butter)]"
            : ""
      }`}
    >
      <div>
        <div className="text-base font-semibold tracking-tight">{productName}</div>
        <div className="mt-0.5 text-xs text-ink-muted">
          {pendingAck && requestedQty != null ? (
            <>
              <span className="line-through opacity-70">Standing {standingQty}</span>{" "}
              requesting {requestedQty} · {unitPriceLabel}
              <span className="ml-1.5 rounded-md bg-ember-soft px-1.5 py-0.5 text-[11px] font-semibold text-ember">
                needs ack
              </span>
            </>
          ) : showOverride ? (
            <>
              <span className="line-through opacity-70">Standing {standingQty}</span> now {qty} ·{" "}
              {unitPriceLabel}
              <span className="ml-1.5 rounded-md bg-butter-soft px-1.5 py-0.5 text-[11px] font-semibold text-crust">
                override
              </span>
            </>
          ) : (
            <>
              Standing {standingQty} · {unitPriceLabel}
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-0.5 rounded-xl bg-steam p-1">
        <button
          type="button"
          disabled={pending}
          onClick={() => commit(Math.max(0, qty - 1))}
          className="h-9 w-9 rounded-lg bg-flour text-lg shadow-sm hover:bg-crust hover:text-flour disabled:opacity-50"
          aria-label={`Decrease ${productName}`}
        >
          −
        </button>
        <span className="min-w-12 text-center text-[22px] font-bold tabular-nums tracking-tight">
          {pendingAck && requestedQty != null ? requestedQty : qty}
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() => commit(qty + 1)}
          className="h-9 w-9 rounded-lg bg-flour text-lg shadow-sm hover:bg-crust hover:text-flour disabled:opacity-50"
          aria-label={`Increase ${productName}`}
        >
          +
        </button>
      </div>
      {dirty && pending ? (
        <div className="col-span-2 text-xs text-ink-muted">Saving…</div>
      ) : null}
    </div>
  );
}
