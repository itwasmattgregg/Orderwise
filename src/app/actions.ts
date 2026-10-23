"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { clearSession, getSessionUser, orgRoleForUser, requireUser, setSessionUser } from "@/lib/session";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.password !== password) {
    throw new Error("Invalid email or password");
  }
  await setSessionUser(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function demoLoginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("Demo user missing — run pnpm db:seed");
  }
  await setSessionUser(user.id);
  redirect("/dashboard");
}

async function assertAgreementAccess(agreementId: string) {
  const user = await requireUser();
  const agreement = await prisma.agreement.findUniqueOrThrow({
    where: { id: agreementId },
  });
  const role = orgRoleForUser(user, agreement);
  if (!role) throw new Error("FORBIDDEN");
  return { user, agreement, role };
}

export async function updateDeliveryQtyAction(formData: FormData) {
  const agreementId = String(formData.get("agreementId"));
  const lineId = String(formData.get("lineId"));
  const qty = Number(formData.get("qty"));
  if (!Number.isFinite(qty) || qty < 0) throw new Error("Invalid qty");

  const { user, role } = await assertAgreementAccess(agreementId);
  const line = await prisma.deliveryLine.findUniqueOrThrow({
    where: { id: lineId },
    include: {
      assortmentItem: { include: { product: true } },
      delivery: true,
    },
  });

  const pastCutoff = formData.get("pastCutoff") === "true";
  const productName = line.assortmentItem.product.name.toLowerCase();

  if (pastCutoff && role === "buyer") {
    await prisma.deliveryLine.update({
      where: { id: lineId },
      data: { pendingAck: true, requestedQty: qty },
    });
    await prisma.activity.create({
      data: {
        agreementId,
        kind: "SYSTEM",
        body: `${user.name} requested ${productName} ${line.qty} → ${qty} after cutoff`,
        authorId: user.id,
      },
    });
  } else {
    await prisma.deliveryLine.update({
      where: { id: lineId },
      data: { qty, pendingAck: false, requestedQty: null },
    });
    await prisma.activity.create({
      data: {
        agreementId,
        kind: "SYSTEM",
        body: `${user.name} set qty ${productName} → ${qty}`,
        authorId: user.id,
      },
    });
  }

  revalidatePath(`/agreements/${agreementId}`);
}

export async function confirmPendingQtyAction(formData: FormData) {
  const agreementId = String(formData.get("agreementId"));
  const lineId = String(formData.get("lineId"));
  const { user, role } = await assertAgreementAccess(agreementId);
  if (role !== "supplier") throw new Error("Only bakery can confirm");

  const line = await prisma.deliveryLine.findUniqueOrThrow({
    where: { id: lineId },
    include: { assortmentItem: { include: { product: true } } },
  });
  if (line.requestedQty == null) return;

  await prisma.deliveryLine.update({
    where: { id: lineId },
    data: {
      qty: line.requestedQty,
      pendingAck: false,
      requestedQty: null,
    },
  });
  await prisma.activity.create({
    data: {
      agreementId,
      kind: "SYSTEM",
      body: `${user.name} confirmed ${line.assortmentItem.product.name.toLowerCase()} → ${line.requestedQty}`,
      authorId: user.id,
    },
  });
  revalidatePath(`/agreements/${agreementId}`);
}

export async function sendMessageAction(formData: FormData) {
  const agreementId = String(formData.get("agreementId"));
  const body = String(formData.get("body") || "").trim();
  if (!body) return;
  const { user } = await assertAgreementAccess(agreementId);
  await prisma.activity.create({
    data: {
      agreementId,
      kind: "MESSAGE",
      body,
      authorId: user.id,
    },
  });
  revalidatePath(`/agreements/${agreementId}`);
}

export async function skipDeliveryAction(formData: FormData) {
  const agreementId = String(formData.get("agreementId"));
  const deliveryId = String(formData.get("deliveryId"));
  const { user } = await assertAgreementAccess(agreementId);
  await prisma.delivery.update({
    where: { id: deliveryId },
    data: { status: "SKIPPED" },
  });
  await prisma.activity.create({
    data: {
      agreementId,
      kind: "SYSTEM",
      body: `${user.name} skipped a delivery`,
      authorId: user.id,
    },
  });
  revalidatePath(`/agreements/${agreementId}`);
}

export async function markDeliveredAction(formData: FormData) {
  const agreementId = String(formData.get("agreementId"));
  const deliveryId = String(formData.get("deliveryId"));
  const { user, role } = await assertAgreementAccess(agreementId);
  if (role !== "supplier") throw new Error("Only bakery can mark delivered");
  const delivery = await prisma.delivery.update({
    where: { id: deliveryId },
    data: { status: "DELIVERED" },
    include: { lines: true },
  });
  const summary = delivery.lines.map((l) => l.qty).join(" / ");
  await prisma.activity.create({
    data: {
      agreementId,
      kind: "SYSTEM",
      body: `${user.name} marked drop delivered · ${summary}`,
      authorId: user.id,
    },
  });
  revalidatePath(`/agreements/${agreementId}`);
}

export async function updateInventoryAction(formData: FormData) {
  const orgId = String(formData.get("orgId"));
  const itemId = String(formData.get("itemId"));
  const qty = Number(formData.get("qty"));
  if (!Number.isFinite(qty) || qty < 0) throw new Error("Invalid qty");

  const user = await requireUser();
  const member = user.memberships.find((m) => m.orgId === orgId);
  if (!member) throw new Error("FORBIDDEN");

  await prisma.inventoryItem.update({
    where: { id: itemId },
    data: { qty, userId: user.id },
  });

  const agreementId = formData.get("agreementId");
  if (agreementId) revalidatePath(`/agreements/${String(agreementId)}`);
  revalidatePath("/dashboard");
}

export async function addInventoryAction(formData: FormData) {
  const orgId = String(formData.get("orgId"));
  const label = String(formData.get("label") || "").trim();
  const qty = Number(formData.get("qty") || 0);
  if (!label) return;

  const user = await requireUser();
  const member = user.memberships.find((m) => m.orgId === orgId);
  if (!member) throw new Error("FORBIDDEN");

  await prisma.inventoryItem.create({
    data: {
      orgId,
      userId: user.id,
      label,
      qty: Number.isFinite(qty) ? qty : 0,
      unit: String(formData.get("unit") || "ea"),
    },
  });

  const agreementId = formData.get("agreementId");
  if (agreementId) revalidatePath(`/agreements/${String(agreementId)}`);
  revalidatePath("/dashboard");
}

export async function ensureSeededAction() {
  const count = await prisma.user.count();
  if (count === 0) {
    // lazy hint — seed should be run via CLI
    return { needsSeed: true };
  }
  const user = await getSessionUser();
  return { needsSeed: false, loggedIn: !!user };
}
