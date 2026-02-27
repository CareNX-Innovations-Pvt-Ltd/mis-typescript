import admin from "firebase-admin";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Production (Render)
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  // Fix newline issue in private key
  serviceAccount.private_key =
    serviceAccount.private_key.replace(/\\n/g, "\n");

  console.log("Using ENV service account");
} else {
  // Local development
  serviceAccount = require("../../serviceAccountKey.json");
  console.log("Using local serviceAccountKey.json");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const auth = admin.auth();
export const db = admin.firestore();