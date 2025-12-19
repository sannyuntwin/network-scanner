from flask import Flask, render_template, jsonify
from discovery import discover_devices
from port_scan import scan_ports
from hostname import get_hostname
from device_type import identify_device_type

app = Flask(__name__)
NETWORK = "192.168.1.0/24"

def run_scan():
    devices = discover_devices(NETWORK)
    results = []

    for device in devices:
        hostname = get_hostname(device)
        ports = scan_ports(device)
        device_type = identify_device_type(device, hostname, ports)

        note = "Secure"
        if any(p == 80 for p, _ in ports):
            note = "HTTP service detected"

        results.append({
            "ip": device,
            "hostname": hostname,
            "type": device_type,
            "ports": [p for p, _ in ports],
            "note": note
        })

    return results


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/scan")
def scan():
    results = run_scan()
    return jsonify(results)


@app.route("/export")
def export():
    results = run_scan()
    return jsonify({
        "network": NETWORK,
        "device_count": len(results),
        "devices": results
    })


if __name__ == "__main__":
    app.run(debug=True)
