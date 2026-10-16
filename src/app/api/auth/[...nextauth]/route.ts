import NextAuth, { NextAuthOptions } from "next-auth"
import AzureADProvider from "next-auth/providers/azure-ad"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/db"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: "openid profile email User.Read offline_access",
        },
      },
      allowDangerousEmailAccountLinking: true,
      async profile(profile, tokens) {
        let image: string | null = null;
        if (tokens.access_token) {
          try {
            const photoRes = await fetch("https://graph.microsoft.com/v1.0/me/photos/240x240/$value", {
              headers: { Authorization: `Bearer ${tokens.access_token}` },
            });
            if (photoRes.ok) {
              const arrayBuffer = await photoRes.arrayBuffer();
              const base64 = Buffer.from(arrayBuffer).toString("base64");
              image = `data:image/jpeg;base64,${base64}`;
            }
          } catch (e) {
            console.error("Failed to fetch user photo from Graph:", e);
          }
        }
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        if (user.image) {
          token.picture = user.image;
        }
        if (user.email && user.image) {
          try {
            await prisma.user.update({
              where: { email: user.email },
              data: { image: user.image },
            });
          } catch (_) {}
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        if (token.picture) {
          session.user.image = token.picture as string;
        }
      }
      return session;
    },
  },
  logger: {
    error(code, metadata) {
      if (code === 'JWT_SESSION_ERROR') {
        // Suppress this specific error so it doesn't trigger Next.js dev overlay
        return;
      }
      console.error(code, metadata);
    },
    warn(code) {},
    debug(code, metadata) {},
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
