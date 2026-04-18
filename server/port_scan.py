import socket

COMMON_PORTS = {
    22: "SSH",
    80: "HTTP",
    443: "HTTPS",
    3306: "MySQL"
}

def _emit(event_callback, message):
    if event_callback:
        event_callback(message)


def scan_ports(ip, event_callback=None):
    _emit(event_callback, f"Scanning ports on {ip}")
    open_ports = []

    for port, service in COMMON_PORTS.items():
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.5)

        result = sock.connect_ex((ip, port))
        if result == 0:
            _emit(event_callback, f"[+] Port {port} open ({service})")
            open_ports.append((port, service))

        sock.close()

    return open_ports


if __name__ == "__main__":
    scan_ports("192.168.1.1")
