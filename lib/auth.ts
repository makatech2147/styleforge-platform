import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
    signUp: "/auth/register",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (user) {
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );
          
          if (!isPasswordValid) {
            return null;
          }
          
          return {
            id: user.id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
          };
        } else {
          if (!credentials.role) {
            throw new Error("Role is required for sign-up.");
          }
          
          const hashedPassword = await bcrypt.hash(credentials.password, 10);
          const newUser = await prisma.user.create({
            data: {
              email: credentials.email,
              password: hashedPassword,
              role: credentials.role,
              name: credentials.email.split('@')[0],
            },
          });

          if (credentials.role === 'customer') {
            await prisma.customerProfile.create({
              data: {
                userId: newUser.id
              }
            });
          } else if (credentials.role === 'tailor') {
            await prisma.tailorProfile.create({
              data: {
                userId: newUser.id,
                isAvailable: true
              }
            });
          }

          return {
            id: newUser.id.toString(),
            email: newUser.email,
            role: newUser.role,
            name: newUser.name,
          };
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role as string;
        session.user.id = token.sub as string;
      }
      return session;
    },
  },
};
