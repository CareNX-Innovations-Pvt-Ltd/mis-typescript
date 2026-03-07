import axios from "axios";
import jwt from "jsonwebtoken";
import { auth } from "../../config/firebase.js";
import { db } from "../../database/firestore.js";

export const loginService = async (email: string, password: string) => {
  // console.log("API KEY:", process.env.FIREBASE_API_KEY);

  let response;

  try {
    response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        email,
        password,
        returnSecureToken: true,
      }
    );
  } catch (error: any) {
    // console.log("Firebase Error:", error.response?.data);
    throw new Error(
      error.response?.data?.error?.message || "Firebase login failed"
    );
  }

  const idToken = response.data.idToken;
  const decoded = await auth.verifyIdToken(idToken);
  const uid = decoded.uid;

  const userDoc = await db.collection("users").doc(uid).get();

  if (!userDoc.exists) {
    throw new Error("User not found in database");
  }

  const userData = userDoc.data();

  const appToken = jwt.sign(
    {
      uid,
      type: userData?.type,
      allowedOrganizations: userData?.allowedOrganizations || []
    },
    process.env.JWT_SECRET!,
    { expiresIn: "24h" }
  );

  return {
    token: appToken,
    user: userData,
  };
};