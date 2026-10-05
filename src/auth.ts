import type { Provider } from "next-auth/providers";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { canSeeStudio, isGitHubAuthConfigured, isPasswordAuthConfigured } from "@/lib/auth-env";
import { findUserByEmail, verifyUserPassword } from "@/lib/users";

const providers: Provider[] = [];

if (isGitHubAuthConfigured) {
  providers.push(
    GitHub({
      authorization: { params: { scope: "read:user user:email" } },
    }),
  );
}

if (isPasswordAuthConfigured) {
  providers.push(
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        const user = await findUserByEmail(email);
        const valid = await verifyUserPassword(user, password);
        if (!user || !valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
        };
      },
    }),
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  providers,
  callbacks: {
    signIn({ account, profile, user }) {
      if (account?.provider !== "github") return true;
      const email =
        (typeof profile?.email === "string" ? profile.email : null) ?? user.email ?? null;
      return canSeeStudio({
        email,
        id: account.providerAccountId ?? user.id ?? null,
      });
    },
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
