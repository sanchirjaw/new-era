import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

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
      if (account?.provider === "google") {
        try {
          // Import db here to avoid circular imports
          const { db } = await import("@/lib/database");

          // Check if user exists by email
          let existingUser = await db.getUserByEmail(user.email!);

          if (!existingUser) {
            // Create new user in MongoDB
            const userData = {
              name: user.name || "Google User",
              email: user.email!,
              role: "student" as const,
              oauthProvider: "google" as const,
              oauthId: user.id,
              enrolledCourses: [], // Initialize as empty array
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
          console.error("Google OAuth sign-in error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && user) {
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
