import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyPassword } from '../../../lib/auth'; // You'll need to implement this
import { connectToDatabase } from '../../../lib/db'; // You'll need to implement this

export default NextAuth({
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Connect to your database
        const client = await connectToDatabase();
        const db = client.db();

        // Find user by email
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({
          email: credentials.email,
        });

        // If no user found, return null
        if (!user) {
          client.close();
          throw new Error('No user found with that email address.');
        }

        // Verify password
        const isValid = await verifyPassword(
          credentials.password,
          user.password
        );

        // If password is invalid, return null
        if (!isValid) {
          client.close();
          throw new Error('Invalid password.');
        }

        // If everything is valid, return user object
        client.close();
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add user id to token on sign in
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user id to session
      if (token) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin', // Custom sign-in page
    error: '/auth/error', // Error code passed in query string as ?error=
  },
  secret: process.env.NEXTAUTH_SECRET,
});
