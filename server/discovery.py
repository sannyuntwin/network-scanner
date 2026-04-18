import subprocess
import ipaddress


def _emit(event_callback, message):
    if event_callback:
        event_callback(message)


def discover_devices(network, event_callback=None):
    _emit(event_callback, f"Scanning network: {network}")
    active_hosts = []
    network_obj = ipaddress.IPv4Network(network, strict=False)

    for ip in network_obj.hosts():
        result = subprocess.run(
            ["ping", "-n", "1", "-w", "300", str(ip)],
            capture_output=True,
            text=True
        )

        output = result.stdout.lower()

        if "ttl=" in output:
            _emit(event_callback, f"[+] Device found: {ip}")
            active_hosts.append(str(ip))

    return active_hosts


if __name__ == "__main__":
    discover_devices("192.168.1.0/24")
