# AquaSense - Intelligent Water Leak Detection System

**Final Year Engineering Project**
**Team Members:** Albin Biju, Christo George Mathew, Ansel A Jiji, Aromal M I

## Project Overview
**AquaSense** is a next-generation IoT water monitoring platform, rebuilt as a **Production-Grade SaaS Application**. It features a **"Hydro-Modern"** design system, split-screen authentication, and a responsive real-time dashboard. The system integrates an ESP8266 microcontroller with Firebase to detect leaks and optimize water usage.

## ✨ "Project Phoenix" Features
- **Hydro-Modern UI**: A polished design system using Ocean Blue & Teal gradients, glassmorphism cards, and `Inter` typography.
- **SaaS Dashboard**: Responsive sidebar layout with real-time Recharts, Status Indicators, and PDF Reporting.
- **Smart Auth**: Professional split-screen Login/Signup pages with brand visuals and validation.
- **Leak Detection**: AI-driven algorithms to detect anomalies in flow and vibration.
- **Team Page**: Dedicated section showcasing the engineering team.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (Required for the dashboard)
- [Arduino IDE](https://www.arduino.cc/en/software) (For uploading code to ESP8266)

### 1. Setup Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create a new project named `AquaSense`.
3. Enable **Authentication** (Email/Password provider).
4. Enable **Realtime Database** (Start in Test Mode).
5. Copy your Firebase Config keys from Project Settings.
6. Open `src/services/firebase.js` and paste your keys.
7. Open `scripts/simulate_sensors.js` and paste your keys there too.

### 2. Run the Dashboard
Open a terminal in this folder and run:

```bash
# Install dependencies
npm install

# Start the web server
npm run dev
```
Open the link shown (usually `http://localhost:5173`).

### 3. Run Sensor Simulation (Optional)
If you don't have the hardware connected yet, you can simulate data:

```bash
# In a new terminal window
npm run simulate
```
You will see the gauges move on the dashboard!

### 4. Hardware Setup (ESP8266)
1. Open `arduino/aquasense_firmware.ino` in Arduino IDE.
2. Install libraries: `FirebaseArduino`, `OneWire`, `DallasTemperature`.
3. Update `FIREBASE_HOST`, `FIREBASE_AUTH`, `WIFI_SSID`, `WIFI_PASSWORD` in the code.
4. Upload to your ESP8266 NodeMCU.

## Project Structure
- `/src`: Frontend React Code
- `/scripts`: Node.js simulation scripts
- `/arduino`: Hardware firmware code

## Troubleshooting
- **'npm' not found**: Install Node.js from the official website.
- **Firebase Permission Denied**: Check your Realtime Database Rules (set `.read` and `.write` to `true` for testing).

---
*Built with React, Firebase, and IoT.*
