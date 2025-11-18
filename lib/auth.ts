import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type NextAuthOptions, getServerSession } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "./prisma";

type CredentialsUser = AdapterUser & {
  role: string;
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutes in seconds
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        const isValid = await compare(credentials.password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        const authUser: CredentialsUser = {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          emailVerified: user.emailVerified,
          image: user.image ?? undefined,
          role: user.role,
        };

        return authUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        const credentialsUser = user as CredentialsUser;
        token.id = credentialsUser.id;
        token.role = credentialsUser.role;
        token.lastActivity = Date.now();
        
        // Salva la tokenVersion al login
        const dbUser = await prisma.user.findUnique({
          where: { id: credentialsUser.id },
          select: { tokenVersion: true },
        });
        token.tokenVersion = dbUser?.tokenVersion || 0;
      } else if (token.email) {
        // Check if session is expired (30 minutes of inactivity)
        const lastActivity = (token.lastActivity as number) || 0;
        const now = Date.now();
        const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
        
        if (now - lastActivity > thirtyMinutes) {
          // Session expired due to inactivity
          return {}; // This will invalidate the token
        }
        
        // Update lastActivity on token refresh (triggered by client)
        if (trigger === "update") {
          token.lastActivity = now;
        }
        
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true, tokenVersion: true },
        });

        if (dbUser) {
          // Verifica che la tokenVersion corrisponda
          const tokenVersionInToken = (token.tokenVersion as number) || 0;
          if (dbUser.tokenVersion !== tokenVersionInToken) {
            console.log(`🔒 Token invalidated for ${token.email} - password changed`);
            return {}; // Invalida il token
          }
          
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && token.id) {
        const typedToken = token as JWT & { id?: string; role?: string; lastActivity?: number };
        session.user = {
          id: typedToken.id ?? session.user?.id ?? "",
          email: session.user?.email ?? typedToken.email ?? "",
          name: session.user?.name ?? (typedToken.name as string | undefined),
          role: typedToken.role ?? "EMPLOYEE",
        };
        // Add lastActivity to session for client-side tracking
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session as any).lastActivity = typedToken.lastActivity;
      } else {
        // Token is invalid or expired
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return null as any;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Trust host header to support dynamic URLs (localhost, LAN IPs, production domains)
  useSecureCookies: false, // Set to false when using HTTP (not HTTPS)
};

export const getAuthSession = () => getServerSession(authOptions);
