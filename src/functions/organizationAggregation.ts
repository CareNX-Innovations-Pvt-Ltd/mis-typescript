// import * as functions from "firebase-functions";
// import * as admin from "firebase-admin";

// admin.initializeApp();
// const db = admin.firestore();

// export const updateOrganizationCounts = functions.firestore
//   .document("{collectionId}/{docId}")
//   .onWrite(async (change, context) => {

//     const collection = context.params.collectionId;
//     const data = change.after.exists ? change.after.data() : null;

//     if (!data || !data.organizationId) return;

//     const orgId = data.organizationId;

//     const devicesSnap = await db.collection("devices")
//       .where("organizationId", "==", orgId).get();

//     const doctorsSnap = await db.collection("doctors")
//       .where("organizationId", "==", orgId).get();

//     const mothersSnap = await db.collection("mothers")
//       .where("organizationId", "==", orgId).get();

//     const testsSnap = await db.collection("tests")
//       .where("organizationId", "==", orgId).get();

//     await db.collection("organizations").doc(orgId).update({
//       totalDevices: devicesSnap.size,
//       totalDoctors: doctorsSnap.size,
//       totalMothers: mothersSnap.size,
//       totalTests: testsSnap.size,
//       updatedAt: admin.firestore.FieldValue.serverTimestamp(),
//     });

//     return;
//   });