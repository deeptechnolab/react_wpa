import { useEffect, useRef, useState } from "react";
import { saveSerialData } from "./db";
import { syncDataToServer, pushDirectToERP } from "./sync";
import SerialDeviceLog from "./components/SerialDeviceLog";

export default function App() {
  const portRef = useRef(null);
  const readerRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [output, setOutput] = useState("");

  /* ------------------------------
     Sync when internet restores
     ------------------------------ */
  useEffect(() => {
    window.addEventListener("online", syncDataToServer);
    return () => window.removeEventListener("online", syncDataToServer);
  }, []);

  /* ------------------------------
     Connect Serial
     ------------------------------ */
  const connectSerial = async () => {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    portRef.current = port;
    setConnected(true);
    readSerial();
  };

  /* ------------------------------
     Read Serial
     ------------------------------ */
  const readSerial = async () => {
    const reader = portRef.current.readable.getReader();
    readerRef.current = reader;
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        setOutput((p) => p + text);

        // ✅ ONLINE → DIRECT ERP
        if (navigator.onLine) {
          await pushDirectToERP(text);
        }
        // ❌ OFFLINE → LOCAL ONLY
        else {
          await saveSerialData(text);
        }
      }
    } catch (err) {
      console.warn("Serial stopped", err);
    }
  };

  const disconnect = async () => {
    await readerRef.current?.cancel();
    await portRef.current?.close();
    setConnected(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Serial PWA</h2>

      {!connected ? (
        <button onClick={connectSerial}>Connect Serial</button>
      ) : (
        <button onClick={disconnect}>Disconnect</button>
      )}

      <pre>{output}</pre>
      <SerialDeviceLog />
    </div>
  );
}
