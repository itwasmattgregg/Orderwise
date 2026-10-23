"use client";

import { useState } from "react";
import { QtyStepper } from "./QtyStepper";

type Line = {
  id: string;
  qty: number;
  pendingAck: boolean;
  requestedQty: number | null;
  standingQty: number;
  productName: string;
  unitPriceLabel: string;
};

export function DeliveryPanel({
  agreementId,
  lines,
}: {
  agreementId: string;
  lines: Line[];
}) {
  const [pastCutoff, setPastCutoff] = useState(false);

  return (
    <div>
      <label className="mb-3 flex cursor-pointer items-center gap-2 text-xs text-ink-muted">
        <input
          type="checkbox"
          checked={pastCutoff}
          onChange={(e) => setPastCutoff(e.target.checked)}
          className="rounded border-rule"
        />
        Demo: treat edits as after cutoff (cafe requests → bakery confirms)
      </label>
      {lines.map((line) => (
        <QtyStepper
          key={line.id}
          agreementId={agreementId}
          lineId={line.id}
          initialQty={line.qty}
          standingQty={line.standingQty}
          pastCutoff={pastCutoff || line.pendingAck}
          pendingAck={line.pendingAck}
          requestedQty={line.requestedQty}
          productName={line.productName}
          unitPriceLabel={line.unitPriceLabel}
        />
      ))}
    </div>
  );
}
