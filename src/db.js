import { openDB } from "idb";

export const dbPromise = openDB("serial-db", 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("serial-data")) {
      db.createObjectStore("serial-data", {
        keyPath: "id",
        autoIncrement: true,
      });
    }
  },
});

export async function saveSerialData(data) {
  const db = await dbPromise;
  await db.add("serial-data", {
    data,
    timestamp: new Date().toISOString(),
    synced: false,
  });
}
