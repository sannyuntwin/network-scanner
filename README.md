# 🛡️📡 Local Network Scanner & Visualization Tool

![Python](https://img.shields.io/badge/Python-3.8%2B-blue?logo=python)
![Flask](https://img.shields.io/badge/Flask-Web%20App-black?logo=flask)
![Cybersecurity](https://img.shields.io/badge/Cybersecurity-Educational-red?logo=hackthebox)
![License](https://img.shields.io/badge/License-Educational-green)
![Status](https://img.shields.io/badge/Status-Active-success)

> 🧠 **Educational & Ethical Cybersecurity Project**
> Scan and visualize **your own local network** to understand devices, services, and basic security exposure.

---

## 🕵️‍♂️🔍 Project Overview

A **Python-based local network scanner** with a **modern web dashboard** that:

* Discovers devices on a LAN
* Identifies open services
* Classifies device types
* Visualizes the network topology
* Presents results in a clean cybersecurity-style UI

⚠️ **Use only on networks you own or have permission to scan**

---

## 🖼️📸 Screenshots

> 📌 Add screenshots inside a `/screenshots` folder

```
screenshots/
├── dashboard.png
├── dark-mode.png
├── network-diagram.png
```


![Dashboard](screenshots/dashboard.png)
![Dark Mode](screenshots/dark-mode.png)
![Network Diagram](screenshots/network-diagram.png)


---

## ✨🛠️ Features

### 🔍 **Network Discovery**

* 📡 ICMP-based device detection
* 🔌 Safe TCP port scanning (common ports)
* 🏷️ Hostname resolution

### 🧠 **Device Intelligence**

* 🖥️ Computer / 📱 Phone / 🌐 IoT / 🛜 Router detection
* ⚠️ Basic security observations
* 🔐 Non-intrusive analysis only

### 🌐 **Web Dashboard**

* 🔄 Refresh / re-scan button
* ⏳ Loading indicator
* 📊 Device count statistics
* 🌙 Dark mode toggle
* 📤 Export scan results (JSON)
* 🗺️ Interactive network diagram

### 📊 **Visualization**

* 🛜 Router-centered topology
* 🎨 Color-coded device nodes
* 🔍 Zoom & drag interaction

---

## 🖥️⚙️ Tech Stack

| 🔧 Component      | 🧪 Technology                 |
| ----------------- | ----------------------------- |
| 🐍 Language       | Python 3                      |
| 🌐 Backend        | Flask                         |
| ⚡ Frontend       | Next.js (React + TypeScript) |
| 📡 Networking     | socket, subprocess, ipaddress |
| 🎨 Styling        | CSS                           |
| 🗺️ Visualization | vis-network                   |
| 📄 Output         | Web UI, JSON                  |

---

## 📁🗂️ Project Structure

```
network-scanner/
├── server/             # Python backend
│   ├── app.py          # Flask API server
│   ├── scanner.py      # CLI scanner
│   ├── scan_service.py # Shared scan workflow
│   ├── location_resolver.py # Device geolocation resolver
│   ├── device_locations.json # Manual LAN IP to lat/lon mapping
│   ├── discovery.py    # ICMP discovery
│   ├── port_scan.py    # Port scanning
│   ├── hostname.py     # Hostname lookup
│   ├── device_type.py  # Device classification
│   └── risk_check.py   # Security notes
├── frontend/           # Next.js dashboard
│   ├── app/
│   ├── components/
│   └── package.json
├── screenshots/
└── README.md
```

---

## 📥⬇️ Clone the Repository

```bash
git clone https://github.com/sannyuntwin/network-scanner.git
cd network-scanner
```

---

## ⚙️🧰 Setup Instructions

### 🧪 1️⃣ Create Virtual Environment (Recommended)

**Windows**

```bash
python -m venv venv
venv\Scripts\activate
```

**Linux / macOS**

```bash
python3 -m venv venv
source venv/bin/activate
```

---

### 📦 2️⃣ Install Backend Dependencies

```bash
pip install flask tabulate
```

---

### ⚡ 3️⃣ Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

---

## ▶️🚀 How to Run

### 🖥️ Option 1: CLI Scanner

```bash
python server/scanner.py
```

Custom range:

```bash
python server/scanner.py --network 192.168.1.0/24
```

Expected output:

```
✔ Device found: 192.168.1.1
✔ Device found: 192.168.1.119
```

---

### 🌐 Option 2: Web Dashboard (Recommended)

Start backend API:

```bash
python server/app.py
```

Start Next.js frontend (new terminal):

```bash
cd frontend
npm run dev
```

Open browser:

```
http://127.0.0.1:3000
```

Optional network override:

```text
http://127.0.0.1:3000/api/scan?network=192.168.1.0/24
http://127.0.0.1:3000/api/export?network=192.168.1.0/24
```

Backend security controls (environment variables):

```text
SCAN_LOCAL_ONLY=1           # default, only localhost can call /scan and /export
SCAN_RATE_LIMIT_SECONDS=2   # minimum seconds between scan requests per client IP
SCAN_API_KEY=your-secret    # optional, require X-API-Key header on /scan and /export
SCAN_NETWORK=192.168.1.0/24 # default network when query/CLI argument is not provided
FLASK_DEBUG=0               # keep disabled outside local development
```

Frontend proxy setting (`frontend/.env.local`):

```text
BACKEND_API_URL=http://127.0.0.1:5000
```

Real globe setup (required for true map rendering):

1. No map token is required (uses `react-globe.gl` + Three.js).
2. Configure LAN device coordinates in `server/device_locations.json`.

Example `server/device_locations.json`:

```json
{
  "default_site": { "lat": 16.8661, "lon": 96.1951, "label": "Default Site" },
  "devices": {
    "192.168.88.1": { "lat": 16.8663, "lon": 96.1954, "label": "Gateway" },
    "192.168.88.2": { "lat": 16.8662, "lon": 96.1958, "label": "Core Server" }
  }
}
```

Notes:
- LAN private IPs (for example `192.168.x.x`) are not globally geolocatable from IP alone.
- For accurate globe markers, maintain the mapping file with your real site coordinates.

---

## 🧪🧠 How to Test the Project

### ✅ Functional Test Checklist

| 🔍 Test        | ✅ Expected Result           |
| -------------- | --------------------------- |
| 🔄 Refresh     | Scan runs again             |
| ⏳ Loading      | Spinner appears             |
| 📊 Stats       | Device count updates        |
| 🌙 Dark Mode   | UI theme switches           |
| 📤 Export JSON | File downloads              |
| 🗺️ Diagram    | Devices visible & connected |

---

### 🛑 Common Issues

❌ **No devices found**

* Run terminal as administrator
* Ensure network connection
* Disable firewall temporarily (testing only)

❌ **Flask not found**

```bash
pip install flask
```

❌ **Next.js dependencies missing**

```bash
cd frontend
npm install
```

---

## 🧠🧬 How Device Detection Works

🔍 **Heuristic-based identification**:

* 🧭 IP patterns (e.g. `.1` → Router)
* 🏷️ Hostname keywords
* 🔌 Open ports
* 🌐 Service behavior

✅ No exploitation
✅ No brute force
✅ No sniffing

---

## 🔐⚖️ Security & Ethics

✔️ Defensive security only
✔️ Local network scanning
✔️ Educational purpose
✔️ No data interception

---

## 🎓📚 Learning Outcomes

* 🌐 TCP/IP & ICMP fundamentals
* 🔌 Service & port analysis
* 🛡️ Basic security awareness
* 🧩 Backend–frontend integration
* 🗺️ Network visualization

---

## 🛣️🚧 Future Improvements

* 🧬 MAC vendor detection
* 🕒 Scan history
* 🌍 Network segmentation
* 📄 CSV export
* 🐳 Docker support

---

## 📜📄 License

📘 Released for **educational use only**

---

## 🙌💙 Acknowledgements

Inspired by real-world **network discovery & security tools**, built for learning and portfolio demonstration.

