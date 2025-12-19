PROTOCOL_INFO = {
    22: "SSH - Secure remote login",
    80: "HTTP - Unencrypted web traffic",
    443: "HTTPS - Encrypted web traffic",
    3306: "MySQL - Database service"
}

def explain_protocol(port):
    return PROTOCOL_INFO.get(port, "Unknown service")
