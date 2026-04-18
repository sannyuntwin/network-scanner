"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type Ref } from "react";

import type { Device } from "./network-topology";

const Globe = dynamic(async () => {
  const module = await import("react-globe.gl");
  const GlobeComponent = module.default as any;

  function DynamicGlobe({
    forwardedRef,
    ...props
  }: {
    forwardedRef?: Ref<any>;
    [key: string]: unknown;
  }) {
    return <GlobeComponent ref={forwardedRef} {...props} />;
  }

  return DynamicGlobe;
}, { ssr: false });

const MapContainer = dynamic<any>(
  () => import("react-leaflet").then((module) => module.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic<any>(() => import("react-leaflet").then((module) => module.TileLayer), { ssr: false });
const CircleMarker = dynamic<any>(() => import("react-leaflet").then((module) => module.CircleMarker), { ssr: false });
const Popup = dynamic<any>(() => import("react-leaflet").then((module) => module.Popup), { ssr: false });

type LocatedDevice = Device & {
  location: {
    lat: number;
    lon: number;
    label?: string;
    source?: string;
  };
};

type ParsedCidr = {
  networkInt: number;
  maskBits: number;
};

type LatLngTuple = [number, number];

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isLocated(device: Device): device is LocatedDevice {
  const location = device.location;
  if (!location) {
    return false;
  }
  return isFiniteNumber(location.lat) && isFiniteNumber(location.lon);
}

function parseIPv4(ip: string): number[] | null {
  const parts = ip.split(".");
  if (parts.length !== 4) {
    return null;
  }

  const numbers = parts.map((part) => Number.parseInt(part, 10));
  if (numbers.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return null;
  }

  return numbers;
}

function ipv4ToInt(parts: number[]): number {
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

function parseCidr(cidr: string): ParsedCidr | null {
  const [ipPart, maskPart] = cidr.trim().split("/");
  if (!ipPart || !maskPart) {
    return null;
  }

  const maskBits = Number.parseInt(maskPart, 10);
  if (!Number.isInteger(maskBits) || maskBits < 0 || maskBits > 32) {
    return null;
  }

  const ip = parseIPv4(ipPart);
  if (!ip) {
    return null;
  }

  const ipInt = ipv4ToInt(ip);
  const mask = maskBits === 0 ? 0 : (0xffffffff << (32 - maskBits)) >>> 0;
  return {
    networkInt: ipInt & mask,
    maskBits,
  };
}

function inCidr(ip: string, cidr: ParsedCidr): boolean {
  const parsed = parseIPv4(ip);
  if (!parsed) {
    return false;
  }

  const ipInt = ipv4ToInt(parsed);
  const mask = cidr.maskBits === 0 ? 0 : (0xffffffff << (32 - cidr.maskBits)) >>> 0;
  return (ipInt & mask) === cidr.networkInt;
}

export default function MapGlobePanel({
  devices,
  scannedNetwork,
  searchIp,
}: {
  devices: Device[];
  scannedNetwork: string;
  searchIp: string;
}) {
  const [viewMode, setViewMode] = useState<"2d" | "3d">("3d");
  const [selectedIp, setSelectedIp] = useState<string | null>(null);
  const globeRef = useRef<any>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [globeWidth, setGlobeWidth] = useState(960);

  const locatedDevices = useMemo(() => devices.filter(isLocated), [devices]);
  const parsedSubnet = useMemo(() => parseCidr(scannedNetwork), [scannedNetwork]);

  const focusedDevices = useMemo(() => {
    if (!parsedSubnet) {
      return locatedDevices;
    }

    const filtered = locatedDevices.filter((device) => inCidr(device.ip, parsedSubnet));
    return filtered.length > 0 ? filtered : locatedDevices;
  }, [locatedDevices, parsedSubnet]);

  const center = useMemo(() => {
    if (focusedDevices.length === 0) {
      return { lat: 0, lon: 0 };
    }

    const sum = focusedDevices.reduce(
      (acc, device) => ({
        lat: acc.lat + device.location.lat,
        lon: acc.lon + device.location.lon,
      }),
      { lat: 0, lon: 0 },
    );

    return {
      lat: sum.lat / focusedDevices.length,
      lon: sum.lon / focusedDevices.length,
    };
  }, [focusedDevices]);

  const selectedDevice = useMemo(() => {
    if (!selectedIp) {
      return null;
    }
    return focusedDevices.find((device) => device.ip === selectedIp) ?? null;
  }, [focusedDevices, selectedIp]);

  const searchedDevice = useMemo(() => {
    const query = searchIp.trim();
    if (!query) {
      return null;
    }

    const exact = focusedDevices.find((device) => device.ip === query);
    if (exact) {
      return exact;
    }

    return focusedDevices.find((device) => device.ip.startsWith(query)) ?? null;
  }, [focusedDevices, searchIp]);

  const mapFocusDevice = searchedDevice ?? selectedDevice;
  const mapCenter = useMemo<LatLngTuple>(() => {
    if (mapFocusDevice) {
      return [mapFocusDevice.location.lat, mapFocusDevice.location.lon];
    }
    return [center.lat, center.lon];
  }, [center.lat, center.lon, mapFocusDevice]);

  const mapZoom = mapFocusDevice ? 11 : 3;
  const mapKey = `${mapCenter[0].toFixed(4)}-${mapCenter[1].toFixed(4)}-${mapZoom}`;

  useEffect(() => {
    function updateWidth() {
      const width = hostRef.current?.clientWidth ?? 960;
      setGlobeWidth(Math.max(320, Math.floor(width)));
    }

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    if (searchedDevice) {
      setSelectedIp(searchedDevice.ip);
    }
  }, [searchedDevice]);

  useEffect(() => {
    if (viewMode !== "3d" || !globeRef.current) {
      return;
    }

    const controls = globeRef.current.controls?.();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.45;
      controls.enablePan = false;
      controls.minDistance = 140;
      controls.maxDistance = 340;
    }
  }, [viewMode]);

  useEffect(() => {
    if (viewMode !== "3d" || !globeRef.current) {
      return;
    }

    if (searchedDevice) {
      globeRef.current.pointOfView?.(
        {
          lat: searchedDevice.location.lat,
          lng: searchedDevice.location.lon,
          altitude: 1.35,
        },
        850,
      );
      return;
    }

    globeRef.current.pointOfView?.(
      {
        lat: center.lat,
        lng: center.lon,
        altitude: 2.2,
      },
      1100,
    );
  }, [center, searchedDevice, viewMode]);

  useEffect(() => {
    if (!selectedIp) {
      return;
    }

    const stillExists = focusedDevices.some((device) => device.ip === selectedIp);
    if (!stillExists) {
      setSelectedIp(null);
    }
  }, [focusedDevices, selectedIp]);

  return (
    <div className="intelPanel">
      <div className="intelToolbar">
        <span className="microTag">Subnet: {scannedNetwork}</span>
        <div className="modeSwitch" role="tablist" aria-label="Map mode switch">
          <button
            type="button"
            className={viewMode === "2d" ? "modeBtn active" : "modeBtn"}
            onClick={() => setViewMode("2d")}
          >
            2D
          </button>
          <button
            type="button"
            className={viewMode === "3d" ? "modeBtn active" : "modeBtn"}
            onClick={() => setViewMode("3d")}
          >
            3D
          </button>
        </div>
      </div>

      {viewMode === "2d" ? (
        <div className="realMapWrap">
          <MapContainer
            key={mapKey}
            center={mapCenter}
            zoom={mapZoom}
            minZoom={2}
            maxBounds={[[-85, -180], [85, 180]]}
            maxBoundsViscosity={0.8}
            scrollWheelZoom
            className="leafletMapRoot"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              noWrap
            />

            {focusedDevices.map((device) => (
              <CircleMarker
                key={device.ip}
                center={[device.location.lat, device.location.lon]}
                radius={selectedIp === device.ip ? 9 : 6}
                pathOptions={{
                  color: selectedIp === device.ip ? "#7bffea" : "#65eaff",
                  weight: 2,
                  fillColor: selectedIp === device.ip ? "#7bffea" : "#ff607f",
                  fillOpacity: 0.85,
                }}
                eventHandlers={{
                  click: () => setSelectedIp(device.ip),
                }}
              >
                <Popup>
                  <div>
                    <p><b>{device.ip}</b></p>
                    <p>{device.hostname || "Unknown"}</p>
                    <p>{device.type || "Unknown Device"}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          {focusedDevices.length === 0 && (
            <div className="mapInfo overlay">
              <p className="mapInfoTitle">No mapped devices</p>
              <p>Add entries to <code>server/device_locations.json</code> to place markers.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="realMapWrap" ref={hostRef}>
          <div className="globeCanvasHost">
            <Globe
              forwardedRef={globeRef}
              width={globeWidth}
              height={360}
              backgroundColor="rgba(0,0,0,0)"
              globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
              bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
              pointsData={focusedDevices}
              pointLat={(d: LocatedDevice) => d.location.lat}
              pointLng={(d: LocatedDevice) => d.location.lon}
              pointAltitude={(d: LocatedDevice) => (selectedIp === d.ip ? 0.055 : d.ports.length > 0 ? 0.03 : 0.02)}
              pointRadius={(d: LocatedDevice) => (selectedIp === d.ip ? 0.48 : 0.36)}
              pointColor={(d: LocatedDevice) =>
                selectedIp === d.ip ? "#7bffea" : d.ports.includes(80) || d.ports.includes(3306) ? "#ff607f" : "#65eaff"
              }
              pointLabel={(d: LocatedDevice) => `${d.ip}${d.location.label ? ` - ${d.location.label}` : ""}`}
              onPointClick={(d: LocatedDevice) => setSelectedIp(d.ip)}
              atmosphereColor="#78e7ff"
              atmosphereAltitude={0.17}
            />
          </div>

          {focusedDevices.length === 0 && (
            <div className="mapInfo overlay">
              <p className="mapInfoTitle">No mapped devices</p>
              <p>Add entries to <code>server/device_locations.json</code> to place markers.</p>
            </div>
          )}
        </div>
      )}

      {searchIp.trim() && !searchedDevice && (
        <div className="selectedDeviceCard">
          <p>
            <b>Search:</b> {searchIp} is not on the current globe dataset.
          </p>
        </div>
      )}

      {selectedDevice && (
        <div className="selectedDeviceCard">
          <p><b>IP:</b> {selectedDevice.ip}</p>
          <p><b>Hostname:</b> {selectedDevice.hostname || "Unknown"}</p>
          <p><b>Type:</b> {selectedDevice.type || "Unknown Device"}</p>
          <p><b>Ports:</b> {selectedDevice.ports.length > 0 ? selectedDevice.ports.join(", ") : "None"}</p>
          <p><b>Location:</b> {selectedDevice.location.lat.toFixed(4)}, {selectedDevice.location.lon.toFixed(4)}</p>
        </div>
      )}
    </div>
  );
}
