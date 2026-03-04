// import { Firestore } from "@google-cloud/firestore";
// import path from "path";
// import { fileURLToPath } from "url";

// // Recreate __filename and __dirname for ESM
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Absolute path to serviceAccountKey.json
// const serviceAccountPath = path.join(
//   __dirname,
//   "../../serviceAccountKey.json"
// );

// // Initialize Firestore with named database
// export const db = new Firestore({
//   projectId: "mongo-compatibility", // Your Firebase Project ID
//   keyFilename: serviceAccountPath,  // Path to service account
//   databaseId: "fetosense-native",   // Important: Named DB
// });

import { Firestore } from "@google-cloud/firestore";

let firestore;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // 🌍 Production (Render)
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT
  );

  serviceAccount.private_key =
    serviceAccount.private_key.replace(/\\n/g, "\n");

  firestore = new Firestore({
    projectId: serviceAccount.project_id,
    credentials: serviceAccount,
    databaseId: "fetosense-native",
  });

  // console.log("Using ENV Firestore config");
} else {
  // 💻 Local
  firestore = new Firestore({
    keyFilename: "./serviceAccountKey.json",
    databaseId: "fetosense-native",
  });

  // console.log("Using local Firestore config");
}

export const db = firestore;