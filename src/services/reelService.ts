import { createDocument, getCollection } from "@/lib/firebase";
import { reelsCollection } from "@/lib/firebase";
import { Reel } from "@/types";

export const createReel = async (reelData: Omit<Reel, "id">) => {
  return await createDocument(reelsCollection, reelData);
};

export const getReels = async () => {
  return await getCollection(reelsCollection);
};