import subprocess
import ipaddress

def discover_devices(network):
    print(f"Scanning network: {network}\n")
    active_hosts = []

    for ip in ipaddress.IPv4Network(network):
        result = subprocess.run(
            ["ping", "-n", "1", "-w", "300", str(ip)],
            capture_output=True,
            text=True
        )

        output = result.stdout.lower()

        if "ttl=" in output:
            print(f"✔ Device found: {ip}")
            active_hosts.append(str(ip))

    return active_hosts


if __name__ == "__main__":
    discover_devices("192.168.1.0/24")
