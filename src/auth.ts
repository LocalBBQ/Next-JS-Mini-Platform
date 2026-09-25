import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { isAuthConfigured } from "@/lib/auth-env";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: isAuthConfigured
    ? [
        GitHub({
          authorization: { params: { scope: "read:user user:email" } },
        }),
      ]
    : [],
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
