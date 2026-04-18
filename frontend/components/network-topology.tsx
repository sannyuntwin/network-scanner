"use client";

import { useEffect, useRef } from "react";

export type Device = {
  ip: string;
  hostname: string;
  type: string;
  ports: number[];
  note: string;
  location?: {
    lat: number;
    lon: number;
    label?: string;
    source?: string;
  } | null;
};

type VisModule = {
  DataSet: new (items: unknown[]) => unknown;
  Network: new (container: HTMLElement, data: unknown, options: unknown) => {
    destroy: () => void;
  };
};

declare global {
  interface Window {
    vis?: VisModule;
    __visScriptPromise?: Promise<VisModule>;
  }
}

function ensureVisModule(): Promise<VisModule> {
  if (window.vis) {
    return Promise.resolve(window.vis);
  }

  if (window.__visScriptPromise) {
    return window.__visScriptPromise;
  }

  window.__visScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/vis-network/standalone/umd/vis-network.min.js";
    script.async = true;

    script.onload = () => {
      if (window.vis) {
        resolve(window.vis);
        return;
      }
      reject(new Error("vis-network loaded without exposing window.vis"));
    };

    script.onerror = () => {
      reject(new Error("Failed to load vis-network script"));
    };

    document.head.appendChild(script);
  });

  return window.__visScriptPromise;
}

function colorForType(deviceType: string): string {
  if (deviceType.includes("Computer")) {
    return "#00e676";
  }
  if (deviceType.includes("Phone")) {
    return "#ff5db1";
  }
  if (deviceType.includes("IoT")) {
    return "#ffd54f";
  }
  if (deviceType.includes("Router")) {
    return "#ff3d67";
  }
  if (deviceType.includes("Server")) {
    return "#7cc7ff";
  }
  return "#80cbc4";
}

export default function NetworkTopology({ devices }: { devices: Device[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const networkInstanceRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function renderGraph() {
      if (!containerRef.current) {
        return;
      }

      const vis = await ensureVisModule();
      if (isCancelled || !containerRef.current) {
        return;
      }

      const nodes = [
        {
          id: "gateway",
          label: "GATEWAY",
          shape: "box",
          color: { background: "#ff3d67", border: "#ff3d67" },
          font: { color: "#ffffff", face: "Share Tech Mono" },
        },
        ...devices.map((device) => {
          const color = colorForType(device.type);
          return {
            id: device.ip,
            label: `${device.ip}\n${device.type}`,
            color: { background: color, border: color },
            font: { color: "#071018", face: "Share Tech Mono" },
          };
        }),
      ];

      const edges = devices.map((device) => {
        const color = colorForType(device.type);
        return {
          from: "gateway",
          to: device.ip,
          color: { color, opacity: 0.8 },
          width: 2,
        };
      });

      if (networkInstanceRef.current) {
        networkInstanceRef.current.destroy();
      }

      networkInstanceRef.current = new vis.Network(
        containerRef.current,
        {
          nodes: new vis.DataSet(nodes),
          edges: new vis.DataSet(edges),
        },
        {
          physics: {
            stabilization: false,
            barnesHut: {
              gravitationalConstant: -7000,
              springLength: 170,
              springConstant: 0.002,
            },
          },
          nodes: {
            shape: "dot",
            size: 24,
            borderWidth: 2,
          },
          edges: {
            smooth: {
              type: "dynamic",
            },
          },
          interaction: {
            hover: true,
            tooltipDelay: 120,
          },
        },
      );
    }

    renderGraph().catch(() => {
      // Ignore graph render failure so table data remains usable.
    });

    return () => {
      isCancelled = true;
      if (networkInstanceRef.current) {
        networkInstanceRef.current.destroy();
      }
    };
  }, [devices]);

  return <div className="networkPanel" ref={containerRef} />;
}
