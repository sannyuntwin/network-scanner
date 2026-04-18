from tabulate import tabulate

def print_report(results):
    headers = ["IP", "Hostname", "Device Type", "Open Ports", "Notes"]
    table = []

    for r in results:
        ports = ", ".join(str(p) for p in r["ports"]) if r["ports"] else "-"
        table.append([
            r["ip"],
            r["hostname"],
            r["type"],
            ports,
            r["note"]
        ])

    print("\nNetwork Scan Summary\n")
    print(tabulate(table, headers=headers, tablefmt="grid"))
