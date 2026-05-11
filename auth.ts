import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      provider?: string;
      enrolledCourses?: string[];
    };
  }

  interface User {
    id: string;
    provider?: string;
    enrolledCourses?: string[];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID!,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "facebook") {
        try {
          const { db } = await import("@/lib/database");

          let existingUser = user.email ? await db.getUserByEmail(user.email) : null;

          if (!existingUser) {
            const providerName = account.provider === "google" ? "Google User" : "Facebook User";
            const userData = {
              name: user.name || providerName,
              email: user.email || "",
              role: "student" as const,
              oauthProvider: account.provider as "google" | "facebook",
              oauthId: user.id,
              enrolledCourses: [],
            };

            const newUserId = await db.createUser(userData);
            user.id = newUserId.toString();
            user.enrolledCourses = [];
          } else {
            user.id = existingUser._id.toString();
            user.enrolledCourses = existingUser.enrolledCourses?.map(id => id.toString()) || [];
          }

          return true;
        } catch (error) {
          console.error(`${account.provider} OAuth sign-in error:`, error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if ((account?.provider === "google" || account?.provider === "facebook") && user) {
        token.provider = account.provider;
        token.id = user.id;
        token.enrolledCourses = user.enrolledCourses;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.provider = token.provider as string;
        session.user.enrolledCourses = token.enrolledCourses as string[] || [];
      }
      return session;
    },
  },
});
