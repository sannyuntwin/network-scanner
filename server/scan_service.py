import ipaddress

from device_type import identify_device_type
from discovery import discover_devices
from hostname import get_hostname
from location_resolver import get_device_location
from port_scan import scan_ports


def validate_network(network):
    """Validate user input and normalize to a canonical CIDR string."""
    try:
        parsed = ipaddress.IPv4Network(network, strict=False)
    except ValueError as exc:
        raise ValueError(f"Invalid network '{network}'. Use CIDR format like 192.168.1.0/24.") from exc
    return str(parsed)


def run_scan(network):
    normalized_network = validate_network(network)
    logs = []

    def emit(message):
        logs.append(message)

    devices = discover_devices(normalized_network, event_callback=emit)
    results = []

    for device in devices:
        hostname = get_hostname(device)
        ports = scan_ports(device, event_callback=emit)
        device_type = identify_device_type(device, hostname, ports)
        location = get_device_location(device)

        note = "Secure"
        if any(p == 80 for p, _ in ports):
            note = "HTTP service detected"

        results.append(
            {
                "ip": device,
                "hostname": hostname,
                "type": device_type,
                "ports": [p for p, _ in ports],
                "note": note,
                "location": location,
            }
        )

    emit(f"Scan completed: {len(results)} devices analyzed.")
    return {"network": normalized_network, "devices": results, "logs": logs}
