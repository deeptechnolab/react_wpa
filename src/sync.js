import { dbPromise } from "./db";

const ERP_URL = "http://192.168.2.134:8001/";
const API_KEY = "6fe88a21fc34db3";
const API_SECRET = "410a9f5e0182866";

export async function syncDataToServer() {
  if (!navigator.onLine) return;

  const db = await dbPromise;
  const tx = db.transaction("serial-data", "readwrite");
  const store = tx.objectStore("serial-data");

  const all = await store.getAll();
  const unsynced = all.filter((r) => !r.synced);
  if (!unsynced.length) return;

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

  const result = await res.json();
  // console.log("result \n\n\n\n\n\n\n\n\n\n\n\n",result)

  if (result.message?.status === "success") {
    console.log("sucess \n\n\n\n\n\n\n\n\n\n\n\n")
    for (const r of unsynced) {
      r.synced = true;
      await store.put(r);
    }
  }

  await tx.done;
}


