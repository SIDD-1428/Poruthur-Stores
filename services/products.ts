

import { db } from "../firebase/config";

export const getProducts = async () => {
  const snapshot = await db
    .collection("products")
    .get();


  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const getProductById = async (id: string) => {
  const productRef = db
    .collection("products")
    .doc(id);

  const productSnap = await productRef.get();

  if (!productSnap.exists()) {
    return null;
  }

  return {
    id: productSnap.id,
    ...productSnap.data(),
  };
};