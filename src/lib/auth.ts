import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';

const ADMIN_EMAIL = 'sagyamthapa32@gmail.com';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  user: {
    modelName: 'user',
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'admin',
        input: false,
      },
    },
  },
  async onSignUp({ user }: { user: { id: string; email: string } }) {
    // Automatically assign superadmin role to specific email
    if (user.email === ADMIN_EMAIL) {
      await db.update(schema.user).set({ role: 'superadmin' }).where(eq(schema.user.id, user.id));
    }
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
