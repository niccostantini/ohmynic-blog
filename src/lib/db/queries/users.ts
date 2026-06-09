import { and, eq, inArray, ne } from 'drizzle-orm';
import { db } from '../index';
import { users } from '../schema';

export async function getAllUsers() {
  return db.select({
    id: users.id,
    username: users.username,
    email: users.email,
    role: users.role,
    displayName: users.displayName,
    bio: users.bio,
    avatarUrl: users.avatarUrl,
    active: users.active,
    canPublish: users.canPublish,
    createdAt: users.createdAt,
  }).from(users).orderBy(users.createdAt);
}

export async function getUserById(id: string) {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getUserByUsername(username: string) {
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result[0] ?? null;
}

export async function createUser(data: {
  id: string;
  username: string;
  email?: string;
  passwordHash: string;
  role: 'admin' | 'editor' | 'contributor';
  displayName: string;
  mustChangePassword: boolean;
}) {
  const result = await db.insert(users).values(data).returning();
  return result[0];
}

export async function updateUser(
  id: string,
  data: {
    displayName?: string;
    username?: string;
    email?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    role?: 'admin' | 'editor' | 'contributor';
    canPublish?: boolean;
    passwordHash?: string;
    mustChangePassword?: boolean;
  }
) {
  const result = await db.update(users).set(data).where(eq(users.id, id)).returning();
  return result[0];
}

/** Returns true se username già usato da un altro utente */
export async function isUsernameTaken(username: string, excludeId: string): Promise<boolean> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.username, username), ne(users.id, excludeId)))
    .limit(1);
  return rows.length > 0;
}

/** Returns true se email già usata da un altro utente */
export async function isEmailTaken(email: string, excludeId: string): Promise<boolean> {
  if (!email) return false;
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), ne(users.id, excludeId)))
    .limit(1);
  return rows.length > 0;
}

export async function updateUserRole(id: string, role: 'admin' | 'editor' | 'contributor') {
  await db.update(users).set({ role }).where(eq(users.id, id));
}

export async function setUserActive(id: string, active: boolean) {
  await db.update(users).set({ active }).where(eq(users.id, id));
}

export async function updateUserPassword(id: string, passwordHash: string) {
  await db.update(users).set({ passwordHash, mustChangePassword: false }).where(eq(users.id, id));
}

export async function getUserByEmail(email: string) {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] ?? null;
}

export async function setUserResetToken(email: string, token: string, expiresAt: Date) {
  await db
    .update(users)
    .set({ resetToken: token, resetTokenExpiresAt: expiresAt })
    .where(eq(users.email, email));
}

export async function getUserByResetToken(token: string) {
  const result = await db.select().from(users).where(eq(users.resetToken, token)).limit(1);
  return result[0] ?? null;
}

export async function resetUserPassword(token: string, passwordHash: string) {
  const result = await db
    .update(users)
    .set({ passwordHash, mustChangePassword: false, resetToken: null, resetTokenExpiresAt: null })
    .where(eq(users.resetToken, token))
    .returning();
  return result[0] ?? null;
}

// ── Editorial workflow: notification helpers ───────────────────────────────────

/** All active editors and admins (for review notifications) */
export async function getActiveReviewers() {
  return db
    .select({ id: users.id, email: users.email, displayName: users.displayName })
    .from(users)
    .where(and(
      inArray(users.role, ['editor', 'admin']),
      eq(users.active, true),
    ));
}

/** All active admins (for approval notifications) */
export async function getActiveAdmins() {
  return db
    .select({ id: users.id, email: users.email, displayName: users.displayName })
    .from(users)
    .where(and(eq(users.role, 'admin'), eq(users.active, true)));
}
