// scripts/simulate_sensors.js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push } from "firebase/database";

// REPLACE WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyCPbHcT5j3lLVMDAmDX5IAHJuk98vpCH_s",
    authDomain: "aqua-sense-7d9d4.firebaseapp.com",
    databaseURL: "https://aqua-sense-7d9d4-default-rtdb.firebaseio.com/",
    projectId: "aqua-sense-7d9d4",
    storageBucket: "aqua-sense-7d9d4.firebasestorage.app",
    messagingSenderId: "90435088180",
    appId: "1:90435088180:web:09b269403a57c16dda7f61"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

console.log("🌊 AquaSense Sensor Simulation Started...");
console.log("Press Ctrl+C to stop.");



function getRandomValue(min, max) {
    return (Math.random() * (max - min) + min).toFixed(2);
}

function simulate() {
    const flowRate = getRandomValue(10, 30); // L/min
    const pressure = getRandomValue(40, 60); // PSI
    const temperature = getRandomValue(20, 30); // Celsius
    const vibration = Math.random() > 0.95 ? 1 : 0; // Occasional vibration

    const data = {
        timestamp: Date.now(),
        flowRate: parseFloat(flowRate),
        pressure: parseFloat(pressure),
        temperature: parseFloat(temperature),
        vibration: vibration,
        leakDetected: (flowRate > 28 || vibration === 1),
        deviceStatus: "ONLINE"
    };

    // Update current state
    set(ref(db, `sensors/current`), data)
        .then(() => {
            console.log(`[DATA SENT] Flow: ${flowRate} L/min | Pressure: ${pressure} PSI | Leak: ${data.leakDetected}`);
        })
        .catch((err) => console.error("Error sending data:", err));

    // Log history
    push(ref(db, `sensors/history`), data);
}

// Send data every 3 seconds
setInterval(simulate, 3000);
