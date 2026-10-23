import { cookies } from "next/headers";
import { prisma } from "./db";

const COOKIE = "orderwise_uid";

export async function getSessionUser() {
  const jar = await cookies();
  const userId = jar.get(COOKIE)?.value;
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: { include: { org: true } },
    },
  });
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function setSessionUser(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export function orgRoleForUser(
  user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>,
  agreement: { supplierOrgId: string; buyerOrgId: string },
) {
  const orgIds = new Set(user.memberships.map((m) => m.orgId));
  if (orgIds.has(agreement.supplierOrgId)) return "supplier" as const;
  if (orgIds.has(agreement.buyerOrgId)) return "buyer" as const;
  return null;
}
