def check_risks(open_ports):
    print("\nSecurity observations:")

    for port, service in open_ports:
        if port == 80:
            print("⚠ HTTP detected → Data is not encrypted")
        elif port == 22:
            print("⚠ SSH open → Use strong passwords or keys")
        elif port == 3306:
            print("⚠ Database port exposed → Should be internal only")
        else:
            print(f"ℹ {service} detected")


if __name__ == "__main__":
    sample = [(22, "SSH"), (80, "HTTP")]
    check_risks(sample)
