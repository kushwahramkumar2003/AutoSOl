import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import z from "zod";
import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
// Import the nonce store shared with the challenge endpoint.
// The nonce is consumed (deleted) after a single successful verify,
// preventing replay attacks (SEC-001).
import { nonceStore } from "@/lib/nonce-store";

const SigninSchema = z.object({
  publicKey: z.string(),
  signature: z.string(),
  nonce: z.string(),
});

const authTokenExpirationTime =
  z.coerce.number().optional().parse(process.env.AUTH_TOKEN_EXPIRATION_TIME) ??
  60 * 60 * 24 * 7;

const nextAuthSecret = process.env.NEXTAUTH_SECRET;
if (process.env.NODE_ENV === "production" && !nextAuthSecret) {
  throw new Error(
    '[AutoSOl] NEXTAUTH_SECRET is required in production for NextAuth.'
  );
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "signin",
      id: "signin",
      credentials: {
        publicKey: { label: "PublicKey", type: "string" },
        signature: { label: "Signature", type: "string" },
        nonce: { label: "Nonce", type: "string" },
      },
      async authorize(credentials) {
        try {
          const parsedData = SigninSchema.safeParse(credentials);

          if (!parsedData.success) {
            console.error("Invalid input fields:", parsedData.error);
            return null;
          }

          const { publicKey, signature, nonce } = parsedData.data;

          // ── Nonce validation (SEC-001) ─────────────────────────────────
          // Verify the nonce was server-issued for this wallet, is not
          // expired, and has not already been used.
          const stored = nonceStore.get(publicKey);

          if (!stored) {
            console.error("No pending challenge found for wallet:", publicKey);
            return null;
          }

          if (Date.now() > stored.expiresAt) {
            nonceStore.delete(publicKey);
            console.error("Challenge nonce expired for wallet:", publicKey);
            return null;
          }

          if (stored.nonce !== nonce) {
            console.error("Challenge nonce mismatch for wallet:", publicKey);
            return null;
          }

          // Consume the nonce — single-use guarantee.
          nonceStore.delete(publicKey);
          // ──────────────────────────────────────────────────────────────

          const message = new TextEncoder().encode(nonce);
          const signatureUint8 = bs58.decode(signature);
          const publicKeyBytes = new PublicKey(publicKey).toBytes();

          const verified = nacl.sign.detached.verify(
            message,
            signatureUint8,
            publicKeyBytes
          );

          if (!verified) {
            console.error("Invalid signature for wallet:", publicKey);
            return null;
          }

          return {
            id: publicKey,
            name: "User",
            email: "",
            publicKey,
          };
        } catch (error) {
          console.error("Failed to sign in:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      // SEC-004: Do NOT log JWT/session payloads — they contain auth material.
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.publicKey = user.publicKey;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.publicKey = token.publicKey;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth",
    error: "/error",
  },
  session: {
    strategy: "jwt",
    maxAge: authTokenExpirationTime,
  },
  secret: nextAuthSecret,
};
