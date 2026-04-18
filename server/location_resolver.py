import ipaddress
import json
import os
from pathlib import Path
from typing import Any

_CACHE: dict[str, Any] = {
    "path": None,
    "mtime": None,
    "payload": None,
}


def _location_file_path() -> Path:
    override = os.getenv("DEVICE_LOCATION_FILE", "").strip()
    if override:
        return Path(override).expanduser().resolve()
    return Path(__file__).with_name("device_locations.json")


def _valid_coordinate(lat: Any, lon: Any) -> bool:
    if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
        return False
    return -90 <= float(lat) <= 90 and -180 <= float(lon) <= 180


def _coerce_location(entry: Any, source: str) -> dict[str, Any] | None:
    if not isinstance(entry, dict):
        return None

    lat = entry.get("lat")
    lon = entry.get("lon")
    if not _valid_coordinate(lat, lon):
        return None

    location = {
        "lat": float(lat),
        "lon": float(lon),
        "source": source,
    }
    label = entry.get("label")
    if isinstance(label, str) and label.strip():
        location["label"] = label.strip()
    return location


def _load_location_payload() -> dict[str, Any]:
    file_path = _location_file_path()
    mtime = file_path.stat().st_mtime if file_path.exists() else None

    if _CACHE["path"] == str(file_path) and _CACHE["mtime"] == mtime and _CACHE["payload"] is not None:
        return _CACHE["payload"]

    payload: dict[str, Any] = {}
    if file_path.exists():
        try:
            with file_path.open("r", encoding="utf-8") as handle:
                data = json.load(handle)
                if isinstance(data, dict):
                    payload = data
        except (OSError, json.JSONDecodeError):
            payload = {}

    _CACHE["path"] = str(file_path)
    _CACHE["mtime"] = mtime
    _CACHE["payload"] = payload
    return payload


def _env_fallback_location() -> dict[str, Any] | None:
    lat_raw = os.getenv("SCAN_SITE_LAT", "").strip()
    lon_raw = os.getenv("SCAN_SITE_LON", "").strip()
    if not lat_raw or not lon_raw:
        return None

    try:
        lat = float(lat_raw)
        lon = float(lon_raw)
    except ValueError:
        return None

    if not _valid_coordinate(lat, lon):
        return None

    location = {"lat": lat, "lon": lon, "source": "env_site"}
    label = os.getenv("SCAN_SITE_LABEL", "").strip()
    if label:
        location["label"] = label
    return location


def get_device_location(ip: str) -> dict[str, Any] | None:
    payload = _load_location_payload()
    devices_map = payload.get("devices")
    default_site = payload.get("default_site")

    if isinstance(devices_map, dict):
        exact = _coerce_location(devices_map.get(ip), "exact_ip")
        if exact:
            return exact

        # Optional CIDR entries (example key: "192.168.88.0/24")
        ip_obj = ipaddress.ip_address(ip)
        for key, value in devices_map.items():
            if not isinstance(key, str) or "/" not in key:
                continue
            try:
                network = ipaddress.ip_network(key, strict=False)
            except ValueError:
                continue
            if ip_obj in network:
                cidr_location = _coerce_location(value, f"cidr:{key}")
                if cidr_location:
                    return cidr_location

    default_location = _coerce_location(default_site, "default_site")
    if default_location:
        return default_location

    return _env_fallback_location()
