import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
 
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }
      },
      // ... other imports and code ...

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
    // Add a null check for user.password
    if (!user.password) {
      return null;
    }
    
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
  // ... other code ...

} else {
  if (!credentials.role) {
    throw new Error("Role is required for sign-up.");
  }
  
  const hashedPassword = await bcrypt.hash(credentials.password, 10);
  
  // Create user with profile in a single transaction
  const userData: any = {
    email: credentials.email,
    password: hashedPassword,
    role: credentials.role,
    name: credentials.email.split('@')[0],
  };

  // Add profile relation based on role
  if (credentials.role === 'customer') {
    userData.customerProfile = {
      create: {} // Creates an empty customer profile
    };
  } else if (credentials.role === 'tailor') {
    userData.tailorProfile = {
      create: {
        isAvailable: true
      }
    };
  }

  const newUser = await prisma.user.create({
    data: userData,
    include: {
      customerProfile: credentials.role === 'customer',
      tailorProfile: credentials.role === 'tailor'
    }
  });

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
