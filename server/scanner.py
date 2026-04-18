import argparse
import os

from report import print_report
from scan_service import run_scan, validate_network


def main():
    parser = argparse.ArgumentParser(description="Local network scanner")
    parser.add_argument(
        "-n",
        "--network",
        default=os.getenv("SCAN_NETWORK", os.getenv("NETWORK", "192.168.1.0/24")),
        help="Target IPv4 CIDR range (example: 192.168.1.0/24)",
    )
    args = parser.parse_args()

    try:
        network = validate_network(args.network)
    except ValueError as exc:
        raise SystemExit(str(exc)) from exc

    payload = run_scan(network)
    print_report(payload["devices"])


if __name__ == "__main__":
    main()
