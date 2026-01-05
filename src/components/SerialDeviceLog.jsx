import { useEffect, useState } from "react";
import { dbPromise } from "../db";
import { fetchSerialLogsFromERP } from "../api/erpApi";

export default function SerialDeviceLog() {
  const [offlineData, setOfflineData] = useState([]);
  const [onlineData, setOnlineData] = useState([]);
  const [online, setOnline] = useState(navigator.onLine);

  // Load IndexedDB data
  const loadOfflineData = async () => {
    const db = await dbPromise;
    const data = await db.getAll("serial-data");
    setOfflineData(data.reverse());
  };

  // Load ERPNext data
  const loadOnlineData = async () => {
    const data = await fetchSerialLogsFromERP();
    setOnlineData(data);
  };

  useEffect(() => {
    loadOfflineData();
    if (navigator.onLine) loadOnlineData();

    window.addEventListener("online", () => {
      setOnline(true);
      loadOnlineData();
    });

    window.addEventListener("offline", () => {
      setOnline(false);
    });
  }, []);

  return (
    <div style={{ marginTop: 20 }}>
      <h3>
        Serial Device Log{" "}
        <span style={{ color: online ? "green" : "red" }}>
          ({online ? "Online" : "Offline"})
        </span>
      </h3>

      {/* OFFLINE DATA */}
      <h4>Offline Data (IndexedDB)</h4>
      <table border="1" width="100%">
        <thead>
          <tr>
            <th>ID</th>
            <th>Data</th>
            <th>Timestamp</th>
            <th>Synced</th>
          </tr>
        </thead>
        <tbody>
          {offlineData.map((row) => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>{row.data}</td>
              <td>{row.timestamp}</td>
              <td>{row.synced ? "✔" : "❌"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ONLINE DATA */}
      {online && (
        <>
          <h4 style={{ marginTop: 20 }}>ERPNext Data (Online)</h4>
          <table border="1" width="100%">
            <thead>
              <tr>
                <th>ERP ID</th>
                <th>Device</th>
                <th>Payload</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {onlineData.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>{row.device_id}</td>
                  <td>{row.payload}</td>
                  <td>{row.device_timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
