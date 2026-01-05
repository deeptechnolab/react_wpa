import { dbPromise } from "./db";

const ERP_URL = import.meta.env.VITE_ERP_URL;
const API_KEY = import.meta.env.VITE_API_KEY;
const API_SECRET = import.meta.env.VITE_API_SECRET;


let syncing = false;

/* ------------------------------
   ONLINE: Direct ERP Push
------------------------------ */
export async function pushDirectToERP(payload) {
  await fetch(
    `${ERP_URL}/api/method/jkmpcl_procurement.public.api.serial_sync.sync_serial_data`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${API_KEY}:${API_SECRET}`,
      },
      body: JSON.stringify({
        records: JSON.stringify([
          {
            data: payload,
            timestamp: new Date().toISOString(),
            device_id: "ONLINE_DEVICE",
          },
        ]),
      }),
    }
  );
}

/* ------------------------------
   OFFLINE → ONLINE SYNC
------------------------------ */
export async function syncDataToServer() {
  if (!navigator.onLine || syncing) return;
  syncing = true;

  let db, store;

  try {
    // 🔹 Open DB OUTSIDE transaction-sensitive code
    db = await dbPromise;

    // 🔹 Read data first (readonly)
    const readTx = db.transaction("serial-data", "readonly");
    const readStore = readTx.objectStore("serial-data");

    const all = await readStore.getAll();
    await readTx.done;

    const unsynced = all.filter(r => r.synced !== true);

    if (!unsynced.length) {
      console.log("No unsynced records");
      return;
    }

    console.log("Sending records to ERP:", unsynced);

    // 🔹 Call ERP
    const res = await fetch(
      `${ERP_URL}/api/method/jkmpcl_procurement.public.api.serial_sync.sync_serial_data`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${API_KEY}:${API_SECRET}`,
        },
        body: JSON.stringify({
          records: JSON.stringify(unsynced),
        }),
      }
    );

    console.log("HTTP status:", res.status);

    if (!res.ok) {
      const text = await res.text();
      console.error("ERP error response:", text);
      return;
    }

    const result = await res.json();
    console.log("ERP result:", result);

    if (result?.message?.status !== "success") {
      console.warn("ERP did not return success");
      return;
    }

    // 🔹 WRITE transaction (after ERP success)
    const writeTx = db.transaction("serial-data", "readwrite");
    store = writeTx.objectStore("serial-data");

    for (const r of unsynced) {
      await store.put({
        ...r,
        synced: true,   // ✅ THIS WILL NOW PERSIST
      });
    }

    await writeTx.done;

    console.log("IndexedDB updated: synced = true");

    // ⏳ Cleanup after delay
    setTimeout(cleanupSyncedData, 5000);

  } catch (err) {
    console.error("Sync failed:", err);
  } finally {
    syncing = false;
  }
}

/* ------------------------------
   Cleanup synced records
------------------------------ */
async function cleanupSyncedData() {
  const db = await dbPromise;
  const tx = db.transaction("serial-data", "readwrite");
  const store = tx.objectStore("serial-data");

  const all = await store.getAll();
  for (const r of all) {
    if (r.synced === true) {
      await store.delete(r.id);
    }
  }

  await tx.done;
}


