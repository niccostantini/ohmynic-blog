import type { User, Session } from 'lucia';

export type Reader = {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  active: boolean;
  avatarUrl?: string | null;
  country?: string | null;
  city?: string | null;
  website?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  instagram?: string | null;
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
