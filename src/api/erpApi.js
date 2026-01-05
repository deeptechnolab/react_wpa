const ERP_URL = import.meta.env.VITE_ERP_URL;
const API_KEY = import.meta.env.VITE_API_KEY;
const API_SECRET = import.meta.env.VITE_API_SECRET;


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
