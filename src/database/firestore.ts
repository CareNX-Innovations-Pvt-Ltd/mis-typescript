import { Firestore } from "@google-cloud/firestore";
import path from "path";
import { fileURLToPath } from "url";

// Recreate __filename and __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Absolute path to serviceAccountKey.json
const serviceAccountPath = path.join(
  __dirname,
  "../../serviceAccountKey.json"
);

// Initialize Firestore with named database
export const db = new Firestore({
  projectId: "mongo-compatibility", // Your Firebase Project ID
  keyFilename: serviceAccountPath,  // Path to service account
  databaseId: "fetosense-native",   // 🔥 Important: Named DB
});