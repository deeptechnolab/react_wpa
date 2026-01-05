const ERP_URL = "http://192.168.2.134:8001/";
const API_KEY = "6fe88a21fc34db3";
const API_SECRET = "410a9f5e0182866";

export async function fetchSerialLogsFromERP() {
  if (!navigator.onLine) return [];

  const res = await fetch(
    `${ERP_URL}/api/resource/Serial Device Log?fields=["name","device_id","payload","device_timestamp"]&limit_page_length=50`,
    {
      headers: {
        "Authorization": `token ${API_KEY}:${API_SECRET}`,
      },
    }
  );

  const data = await res.json();
  return data.data || [];
}
