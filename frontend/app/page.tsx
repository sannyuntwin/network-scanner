"use client";

import { useMemo, useState } from "react";

import MapGlobePanel from "../components/map-globe-panel";
import type { Device } from "../components/network-topology";

type ScanResponsePayload =
  | Device[]
  | {
      network: string;
      devices: Device[];
    };

function buildErrorMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof (payload as { error?: unknown }).error === "string"
  ) {
    return (payload as { error: string }).error;
  }

  return fallback;
}

async function parseResponsePayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return { error: text || "Request failed." };
}

export default function HomePage() {
  const [network, setNetwork] = useState("192.168.1.0/24");
  const [scannedNetwork, setScannedNetwork] = useState("192.168.1.0/24");
  const [searchIp, setSearchIp] = useState("");
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function startScan() {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/scan?network=${encodeURIComponent(network)}`);
      const payload = await parseResponsePayload(response);

      if (!response.ok) {
        throw new Error(buildErrorMessage(payload, "Scan request failed."));
      }

      const parsed = payload as ScanResponsePayload;
      if (Array.isArray(parsed)) {
        setDevices(parsed);
        setScannedNetwork(network);
      } else {
        setDevices(parsed.devices ?? []);
        setScannedNetwork(parsed.network ?? network);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Scan failed.");
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }

  const searchStatus = useMemo(() => {
    const query = searchIp.trim();
    if (!query) {
      return "Type an IP to focus on globe.";
    }

    const exists = devices.some((device) => device.ip === query);
    return exists ? `Found ${query}` : `${query} not found in current scan.`;
  }, [devices, searchIp]);

  return (
    <main className="page">
      <div className="hudGridOverlay" />
      <div className="hudVignette" />

      <section className="hudShell">
        <header className="hudHeader">
          <div>
            <p className="eyebrow">Network Scanner</p>
            <h1>Globe Search</h1>
          </div>
          <div className="headerBadges">
            <span className="badge">Status: {loading ? "SCANNING" : "READY"}</span>
            <span className="badge">Devices: {devices.length}</span>
          </div>
        </header>

        <section className="controlDeck">
          <div className="controlRow">
            <label className="controlLabel">
              Network CIDR
              <input
                type="text"
                value={network}
                onChange={(event) => setNetwork(event.target.value)}
                placeholder="192.168.1.0/24"
              />
            </label>
            <label className="controlLabel">
              Search IP On Globe
              <input
                type="text"
                value={searchIp}
                onChange={(event) => setSearchIp(event.target.value)}
                placeholder="192.168.1.25"
              />
            </label>
            <div className="buttonRow">
              <button onClick={startScan} disabled={loading}>
                {loading ? "SCANNING..." : "SCAN NETWORK"}
              </button>
            </div>
          </div>

          <div className="statusDeck">
            <div className="statusText">{searchStatus}</div>
          </div>

          {errorMessage && <p className="errorText">{errorMessage}</p>}
        </section>

        <article className="hudCard worldCard">
          <MapGlobePanel devices={devices} scannedNetwork={scannedNetwork} searchIp={searchIp} />
        </article>
      </section>
    </main>
  );
}
