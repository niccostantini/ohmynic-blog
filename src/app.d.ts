import type { User, Session } from 'lucia';

export type Reader = {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  avatarUrl?: string | null;
};

declare global {
  namespace App {
    interface Locals {
      user: User | null;
      session: Session | null;
      reader: Reader | null;
      readerSessionId: string | null;
    }
  }
}

export {};
