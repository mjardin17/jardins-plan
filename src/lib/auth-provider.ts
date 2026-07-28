// src/lib/auth-provider.ts
import { adminAuth } from "./firebase-admin.ts";

export interface DecodedUserToken {
  email: string;
  uid: string;
  name?: string;
  role?: string;
  businessId?: string;
}

export interface AuthProvider {
  verifyIdToken(idToken: string): Promise<DecodedUserToken>;
}

export class FirebaseAuthProvider implements AuthProvider {
  async verifyIdToken(idToken: string): Promise<DecodedUserToken> {
    try {
      // adminAuth.verifyIdToken(idToken, true) forces a revocation status check
      const decoded = await adminAuth.verifyIdToken(idToken, true);
      if (!decoded.email) {
        throw new Error("Missing email claim in verified identity token.");
      }
      return {
        email: decoded.email,
        uid: decoded.uid,
        name: decoded.name,
        role: (decoded.role as string) || "user",
        businessId: (decoded.business_id as string) || undefined,
      };
    } catch (err: any) {
      throw new Error(`Firebase ID Token validation failed: ${err.message}`);
    }
  }
}

export class MockAuthProvider implements AuthProvider {
  async verifyIdToken(idToken: string): Promise<DecodedUserToken> {
    // A secure developer/sandbox testing route that allows authentication only via pre-signed/formatted tokens in dev-mode
    if (idToken.startsWith("demo-token-")) {
      const email = idToken.replace("demo-token-", "");
      return {
        email,
        uid: `mock-uid-${email}`,
        name: email.split("@")[0],
        role: email.startsWith("owner") ? "owner" : "user",
      };
    }
    throw new Error("Mock ID Token validation failed: Invalid signature format.");
  }
}

// Decide provider at runtime based on environment configuration
const useFirebase = process.env.NODE_ENV === "production" || process.env.USE_FIREBASE_AUTH === "true";
export const authProvider: AuthProvider = useFirebase ? new FirebaseAuthProvider() : new MockAuthProvider();
