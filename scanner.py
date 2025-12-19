from discovery import discover_devices
from port_scan import scan_ports
from hostname import get_hostname
from device_type import identify_device_type
from report import print_report

NETWORK = "192.168.1.0/24"
results = []

devices = discover_devices(NETWORK)

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
        "ports": [p for p, _ in ports],
        "note": note,
        "type": device_type
    })

print_report(results)
