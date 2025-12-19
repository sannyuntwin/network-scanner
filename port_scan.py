import socket

COMMON_PORTS = {
    22: "SSH",
    80: "HTTP",
    443: "HTTPS",
    3306: "MySQL"
}

def scan_ports(ip):
    print(f"\nScanning ports on {ip}")
    open_ports = []

    for port, service in COMMON_PORTS.items():
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.5)

        result = sock.connect_ex((ip, port))
        if result == 0:
            print(f"✔ Port {port} open ({service})")
            open_ports.append((port, service))

        sock.close()

    return open_ports


if __name__ == "__main__":
    scan_ports("192.168.1.1")
