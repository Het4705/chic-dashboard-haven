import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where as firestoreWhere, 
  orderBy as firestoreOrderBy, 
  limit as firestoreLimit, 
  WhereFilterOp,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import {
  getStorage,

} from "firebase/storage";

// This is a placeholder config - you'll need to replace this with your actual Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);

// Collections references
export const usersCollection = collection(db, 'users');
export const productsCollection = collection(db, 'products');
export const ordersCollection = collection(db, 'orders');
export const collectionsCollection = collection(db, 'collections');
export const reelsCollection = collection(db, 'reels');

// Cloudinary upload helper function
export const uploadFileToCloudinary = async (file: File): Promise<string> => {
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${
    import.meta.env.VITE_CLOUD_NAME
  }/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", import.meta.env.VITE_UPLOAD_PRESET_NAME);
  const response = await fetch(cloudinaryUrl, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error("Failed to upload image to Cloudinary");
  }
  const data = await response.json();
  return data.secure_url;
};

// Cloudinary delete helper function
export const deleteFileFromCloudinary = async (
  imageUrl: string
): Promise<void> => {
  const publicId = imageUrl.split("/").pop()?.split(".")[0];
  if (!publicId) return;

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${
    import.meta.env.VITE_CLOUD_NAME
  }/destroy`;
  const formData = new FormData();
  formData.append("public_id", publicId);
  formData.append("upload_preset", import.meta.env.VITE_UPLOAD_PRESET_NAME );
  formData.append("api_key", import.meta.env.VITE_CLOUDINARY_API_KEY);

  await fetch(cloudinaryUrl, {
    method: "POST",
    body: formData,
  });
};

// Firestore helper functions
export const createDocument = async (
  collectionRef: any,
  data: Record<string, any>
) => {
  const documentData = {
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...data
  };

  return await addDoc(collectionRef, documentData);
};

export const updateDocument = async (
  collectionName: string,
  id: string,
  data: Record<string, any>
) => {
  const docRef = doc(db, collectionName, id);

  const documentData = {
    updatedAt: serverTimestamp(),
    ...data
  };

  return await updateDoc(docRef, documentData);
};

export const deleteDocument = async (collectionName: string, id: string) => {
  const docRef = doc(db, collectionName, id);
  return await deleteDoc(docRef);
};

export const getDocument = async (collectionName: string, id: string) => {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    return null;
  }
};

export const getCollection = async (
  collectionRef: any,
  constraints: any[] = []
) => {

  let q = collectionRef;

  if (constraints.length > 0) {
    q = query(collectionRef, ...constraints);
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data() as Record<string, any>
  }));
};

// Export renamed functions to avoid conflicts
export const where = firestoreWhere;
export const orderBy = firestoreOrderBy;
export const limit = firestoreLimit;
export { Timestamp, serverTimestamp };

export default app;
