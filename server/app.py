import os
import threading
import time
from functools import wraps

from flask import Flask, jsonify, request

from scan_service import run_scan


def _read_float_env(name, default):
    value = os.getenv(name, str(default))
    try:
        return float(value)
    except ValueError:
        return float(default)


def _is_truthy(value):
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


app = Flask(__name__)
DEFAULT_NETWORK = os.getenv("SCAN_NETWORK", os.getenv("NETWORK", "192.168.1.0/24"))
ENFORCE_LOCAL_ONLY = os.getenv("SCAN_LOCAL_ONLY", "1") == "1"
SCAN_API_KEY = os.getenv("SCAN_API_KEY", "")
SCAN_RATE_LIMIT_SECONDS = _read_float_env("SCAN_RATE_LIMIT_SECONDS", 2)
LOCALHOST_IPS = {"127.0.0.1", "::1"}
_rate_limit_lock = threading.Lock()
_last_scan_by_ip = {}


def _get_client_ip():
    return request.remote_addr or "unknown"


def _is_local_client(client_ip):
    return client_ip in LOCALHOST_IPS


def scan_access_control(handler):
    @wraps(handler)
    def wrapper(*args, **kwargs):
        client_ip = _get_client_ip()

        if ENFORCE_LOCAL_ONLY and not _is_local_client(client_ip):
            return jsonify({"error": "Remote access is blocked. Set SCAN_LOCAL_ONLY=0 to allow it."}), 403

        if SCAN_API_KEY:
            provided_key = request.headers.get("X-API-Key", "")
            if provided_key != SCAN_API_KEY:
                return jsonify({"error": "Unauthorized. Provide a valid X-API-Key header."}), 401

        if SCAN_RATE_LIMIT_SECONDS > 0:
            now = time.monotonic()
            with _rate_limit_lock:
                last_scan_time = _last_scan_by_ip.get(client_ip, 0)
                elapsed = now - last_scan_time
                if elapsed < SCAN_RATE_LIMIT_SECONDS:
                    retry_after = max(0.0, SCAN_RATE_LIMIT_SECONDS - elapsed)
                    return (
                        jsonify(
                            {
                                "error": f"Too many scan requests. Retry in {retry_after:.1f}s.",
                            }
                        ),
                        429,
                    )
                _last_scan_by_ip[client_ip] = now

        return handler(*args, **kwargs)

    return wrapper


@app.after_request
def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' https://unpkg.com 'unsafe-inline'; "
        "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; "
        "font-src 'self' https://fonts.gstatic.com data:; "
        "img-src 'self' data:; "
        "connect-src 'self'; "
        "frame-ancestors 'none'; "
        "base-uri 'self'"
    )
    return response


@app.route("/")
def index():
    return jsonify(
        {
            "message": "Network scanner API is running.",
            "next_frontend": "Start the Next.js app in ./frontend and open http://127.0.0.1:3000",
        }
    )


@app.route("/scan")
@scan_access_control
def scan():
    requested_network = request.args.get("network", DEFAULT_NETWORK)
    with_logs = _is_truthy(request.args.get("with_logs", "0"))
    try:
        payload = run_scan(requested_network)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": f"Scan failed: {exc}"}), 500
    if with_logs:
        return jsonify(payload)
    return jsonify(payload["devices"])


@app.route("/export")
@scan_access_control
def export():
    requested_network = request.args.get("network", DEFAULT_NETWORK)
    with_logs = _is_truthy(request.args.get("with_logs", "0"))
    try:
        payload = run_scan(requested_network)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": f"Export failed: {exc}"}), 500
    response_payload = {
        "network": payload["network"],
        "device_count": len(payload["devices"]),
        "devices": payload["devices"],
    }
    if with_logs:
        response_payload["logs"] = payload.get("logs", [])
    return jsonify(response_payload)


if __name__ == "__main__":
    app.run(debug=os.getenv("FLASK_DEBUG", "0") == "1")
