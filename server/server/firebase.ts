import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

let db: FirebaseFirestore.Firestore | null = null;

export { FieldValue };

export function getFirebaseDb(): FirebaseFirestore.Firestore {
  if (db) return db;

  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    
    if (!projectId) {
      throw new Error("FIREBASE_PROJECT_ID must be set");
    }

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) as ServiceAccount;
        initializeApp({
          credential: cert(serviceAccount),
          projectId,
        });
      } catch (error) {
        throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON format");
      }
    } else {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY must be set for Firebase Admin SDK. " +
        "Download it from Firebase Console > Project Settings > Service Accounts > Generate new private key"
      );
    }
  }

  db = getFirestore();
  return db;
}
