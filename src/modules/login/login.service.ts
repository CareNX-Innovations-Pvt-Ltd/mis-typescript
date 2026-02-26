import axios from "axios";
import jwt from "jsonwebtoken";
import { auth, db } from "../../config/firebase.js";

export const loginService = async (email: string, password: string) => {
  // 1 Verify email/password with Firebase REST API
  const response = await axios.post(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
    {
      email,
      password,
      returnSecureToken: true,
    }
  );

  const idToken = response.data.idToken;

  // 2 Verify token
  const decoded = await auth.verifyIdToken(idToken);
  const uid = decoded.uid;

  // 3️ Fetch user from Firestore
  const userDoc = await db.collection("users").doc(uid).get();

  if (!userDoc.exists) {
    throw new Error("User not found in database");
  }

  const userData = userDoc.data();

  // 4️ Generate your own JWT
  const appToken = jwt.sign(
    {
      uid,
      type: userData?.type,
      allowedOrganizations: userData?.allowedOrganizations,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "8h" }
  );

  return {
    token: appToken,
    user: userData,
  };
};