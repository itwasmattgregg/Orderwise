import { PrismaClient } from "@prisma/client";
import { addDays, nextWednesday, setHours, setMinutes, startOfDay } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  await prisma.deliveryLine.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.assortmentItem.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.agreement.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  const maya = await prisma.user.create({
    data: { email: "maya@cafeluna.test", name: "Maya Chen", password: "demo" },
  });
  const owen = await prisma.user.create({
    data: { email: "owen@rivertown.test", name: "Owen Rivera", password: "demo" },
  });

  const cafe = await prisma.organization.create({
    data: { name: "Cafe Luna", kind: "CAFE" },
  });
  const bakery = await prisma.organization.create({
    data: { name: "Rivertown Bakery", kind: "BAKERY" },
  });

  await prisma.membership.createMany({
    data: [
      { userId: maya.id, orgId: cafe.id, role: "manager" },
      { userId: owen.id, orgId: bakery.id, role: "owner" },
    ],
  });

  const croissants = await prisma.product.create({
    data: { orgId: bakery.id, name: "Croissants", unit: "ea", priceCents: 240 },
  });
  const pain = await prisma.product.create({
    data: { orgId: bakery.id, name: "Pain au chocolat", unit: "ea", priceCents: 275 },
  });
  const sourdough = await prisma.product.create({
    data: { orgId: bakery.id, name: "Sourdough loaves", unit: "ea", priceCents: 700 },
  });

  const agreement = await prisma.agreement.create({
    data: {
      supplierOrgId: bakery.id,
      buyerOrgId: cafe.id,
      status: "ACTIVE",
      cadenceLabel: "Mon · Wed · Fri",
      cutoffLabel: "2:00pm day before",
      settlement: "MANUAL",
    },
  });

  const aCroissant = await prisma.assortmentItem.create({
    data: {
      agreementId: agreement.id,
      productId: croissants.id,
      standingQty: 24,
      unitPriceCents: 240,
    },
  });
  const aPain = await prisma.assortmentItem.create({
    data: {
      agreementId: agreement.id,
      productId: pain.id,
      standingQty: 12,
      unitPriceCents: 275,
    },
  });
  const aSourdough = await prisma.assortmentItem.create({
    data: {
      agreementId: agreement.id,
      productId: sourdough.id,
      standingQty: 8,
      unitPriceCents: 700,
    },
  });

  const wed = setMinutes(setHours(startOfDay(nextWednesday(new Date())), 7), 0);
  const mon = addDays(wed, -2);
  const fri = addDays(wed, 2);

  const monDelivery = await prisma.delivery.create({
    data: {
      agreementId: agreement.id,
      date: mon,
      status: "DELIVERED",
      lines: {
        create: [
          { assortmentItemId: aCroissant.id, qty: 24 },
          { assortmentItemId: aPain.id, qty: 12 },
          { assortmentItemId: aSourdough.id, qty: 8 },
        ],
      },
    },
  });

  await prisma.delivery.create({
    data: {
      agreementId: agreement.id,
      date: wed,
      status: "SCHEDULED",
      note: "Side door, ask for Maya",
      lines: {
        create: [
          { assortmentItemId: aCroissant.id, qty: 24 },
          { assortmentItemId: aPain.id, qty: 12 },
          { assortmentItemId: aSourdough.id, qty: 8 },
        ],
      },
    },
  });

  await prisma.delivery.create({
    data: {
      agreementId: agreement.id,
      date: fri,
      status: "SCHEDULED",
      lines: {
        create: [
          { assortmentItemId: aCroissant.id, qty: 24 },
          { assortmentItemId: aPain.id, qty: 12 },
          { assortmentItemId: aSourdough.id, qty: 8 },
        ],
      },
    },
  });

  await prisma.activity.createMany({
    data: [
      {
        agreementId: agreement.id,
        kind: "SYSTEM",
        body: "Cafe Luna set Wed croissants standing → 24",
        createdAt: addDays(mon, -1),
      },
      {
        agreementId: agreement.id,
        kind: "MESSAGE",
        authorId: maya.id,
        body: "Festival on Saturday — can we bump Friday croissants later this week?",
        createdAt: addDays(mon, -1),
      },
      {
        agreementId: agreement.id,
        kind: "MESSAGE",
        authorId: owen.id,
        body: "Yes — just change Fri before Thursday 2pm and we’ll bake it.",
        createdAt: addDays(mon, -1),
      },
      {
        agreementId: agreement.id,
        kind: "SYSTEM",
        body: `Mon drop delivered · 24 / 12 / 8`,
        createdAt: monDelivery.date,
      },
    ],
  });

  await prisma.inventoryItem.createMany({
    data: [
      {
        orgId: cafe.id,
        userId: maya.id,
        label: "Croissants on hand",
        qty: 6,
        unit: "ea",
        notes: "Pastry case",
      },
      {
        orgId: cafe.id,
        userId: maya.id,
        label: "Sourdough on hand",
        qty: 2,
        unit: "loaf",
      },
      {
        orgId: bakery.id,
        userId: owen.id,
        label: "Croissant dough (tomorrow)",
        qty: 120,
        unit: "ea",
        notes: "Pre-shaped",
      },
      {
        orgId: bakery.id,
        userId: owen.id,
        label: "Butter (kg)",
        qty: 18,
        unit: "kg",
      },
    ],
  });

  console.log("Seeded Orderwise demo:");
  console.log("  Cafe:   maya@cafeluna.test / demo");
  console.log("  Bakery: owen@rivertown.test / demo");
  console.log("  Agreement:", agreement.id);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
