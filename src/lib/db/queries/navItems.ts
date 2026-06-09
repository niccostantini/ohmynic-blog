import { eq, asc } from 'drizzle-orm';
import { db } from '../index';
import { navItems } from '../schema';

export async function getVisibleNavItems() {
  return db
    .select()
    .from(navItems)
    .where(eq(navItems.visible, true))
    .orderBy(asc(navItems.position));
}

export async function getAllNavItems() {
  return db
    .select()
    .from(navItems)
    .orderBy(asc(navItems.position));
}

export async function createNavItem(data: {
  label: string;
  url?: string;
  pageId?: string;
  type?: 'page' | 'external' | 'fixed';
  openInNewTab?: boolean;
}) {
  const all = await getAllNavItems();
  const maxPos = all.length > 0 ? Math.max(...all.map((i) => i.position)) : -1;
  const result = await db.insert(navItems).values({
    label: data.label,
    url: data.url ?? null,
    pageId: data.pageId ?? null,
    type: data.type ?? 'external',
    position: maxPos + 1,
    visible: true,
    openInNewTab: data.openInNewTab ?? false,
  }).returning();
  return result[0];
}

export async function updateNavItem(id: string, data: Partial<{
  label: string;
  visible: boolean;
  openInNewTab: boolean;
}>) {
  const result = await db.update(navItems).set(data).where(eq(navItems.id, id)).returning();
  return result[0] ?? null;
}

export async function deleteNavItem(id: string) {
  await db.delete(navItems).where(eq(navItems.id, id));
}

export async function reorderNavItems(items: { id: string; position: number }[]) {
  await db.transaction(async (tx) => {
    for (const { id, position } of items) {
      await tx.update(navItems).set({ position }).where(eq(navItems.id, id));
    }
  });
}

export async function syncPageNavItem(pageId: string, label: string, slug: string, show: boolean) {
  const existing = await db
    .select()
    .from(navItems)
    .where(eq(navItems.pageId, pageId))
    .limit(1);

  if (show) {
    if (existing.length === 0) {
      await createNavItem({ label, url: `/blog/${slug}`, pageId, type: 'page' });
    } else {
      await updateNavItem(existing[0].id, { label, visible: true });
    }
  } else {
    if (existing.length > 0) {
      await updateNavItem(existing[0].id, { visible: false });
    }
  }
}
