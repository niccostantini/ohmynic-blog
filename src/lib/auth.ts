import { Lucia } from 'lucia';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from './db/index';
import { sessions, users } from './db/schema';

const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    },
  },
  getUserAttributes: (attributes) => {
    return {
      username: attributes.username,
      role: attributes.role,
      displayName: attributes.display_name,
      bio: attributes.bio,
      avatarUrl: attributes.avatar_url,
      active: attributes.active,
      mustChangePassword: attributes.must_change_password,
      canPublish: attributes.can_publish,
    };
  },
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      username: string;
      role: 'admin' | 'editor' | 'contributor';
      display_name: string | null;
      bio: string | null;
      avatar_url: string | null;
      active: boolean;
      must_change_password: boolean;
      can_publish: boolean;
    };
  }
}
