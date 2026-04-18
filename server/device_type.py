def identify_device_type(ip, hostname, open_ports):
    ports = [p for p, _ in open_ports]
    hostname = hostname.lower()

    if ip.endswith(".1"):
        return "Router"

    if "laptop" in hostname or "pc" in hostname or "desktop" in hostname:
        return "Computer"

    if 3306 in ports:
        return "Database Server"

    if 22 in ports:
        return "Server (Linux/SSH)"

    if 80 in ports or 443 in ports:
        return "Web Device / IoT"

    if hostname == "unknown" and not ports:
        return "Phone / IoT"

    return "Unknown Device"
