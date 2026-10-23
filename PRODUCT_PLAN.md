# Orderwise — Product Plan

**Name:** Orderwise  
**Beachhead:** Bakeries delivering standing orders to coffee shops  
**One-liner:** Bring-your-own products. Shared standing orders — quantities, messages, and settlement both sides actually use.

---

## 0. Decisions locked

| Decision | Choice |
|----------|--------|
| **Name** | **Orderwise** |
| First vertical | Bakery → coffee shop deliveries |
| GTM posture | Equal UX for suppliers *and* buyers |
| Core job | Qty changes + day-to-day communication |
| Assortment | Relationship-scoped menu of what can be requested (not inventory, not marketplace) |
| Inventory | Super-simple tracking UX for either side (optional counts / “what we have / need”) — not full WMS |
| Payments | Card, Stripe invoice, or manual/offline |
| Product shape | Shared agreement workspace |

---

## Positioning

Orderwise is a **shared standing-order OS**:

- Not a marketplace  
- Not full inventory/ERP  
- Not SaaS seat billing (Chargebee territory)  

**Pitch:** “One place for your standing order. Update quantities in seconds. Both sides see the same thing.”

---

## Domain (short)

| Object | Meaning |
|--------|---------|
| Organization | Bakery or Cafe (or both) |
| Catalog | Supplier BYO products |
| **Assortment** | What this buyer can ask for on this agreement |
| Agreement | Shared standing order + cutoff + settlement |
| Delivery | One scheduled drop + qty overrides |
| Simple inventory | Lightweight counts either side can keep (optional) |
| Message / Activity | Chat + system events |
| Period bill | What to settle |

---

## Status

- **MVP app scaffolded** in this workspace (Next.js + Prisma/SQLite)  
- Demo: Cafe Luna ↔ Rivertown Bakery with assortment, thread, qty, simple inventory  
- Stripe Connect / invites / enterprise network: not built yet  
- **No GitHub remote** on this Cloud Agent — create a repo and attach it to push

---

## Name

**Orderwise** — order-first, wise ops for both sides of the standing relationship.
