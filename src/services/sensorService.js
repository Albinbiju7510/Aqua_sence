import { ref, onValue, get } from "firebase/database";
import { rtdb } from "./firebase";

export const fetchRTDBData = async () => {
    try {
        const snapshot = await get(ref(rtdb, 'sensors/current'));
        if (snapshot.exists()) {
            const data = snapshot.val();
            return {
                flowRate: data.flowRate || 0,
                totalUsage: data.totalUsage || 0,
                leakStatus: data.leakDetected ? 1 : 0,
                vibration: data.vibration || 0,
                pressure: data.pressure || 0,
                vibrationAlarm: data.vibrationAlarm || 0,
                timestamp: data.timestamp || Date.now()
            };
        }
    } catch (error) {
        console.error("Error fetching RTDB data:", error);
    }
    return null;
};

export const subscribeRTDBData = (callback) => {
    const sensorRef = ref(rtdb, 'sensors/current');
    return onValue(sensorRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            callback({
                flowRate: data.flowRate || 0,
                totalUsage: data.totalUsage || 0,
                leakStatus: data.leakDetected ? 1 : 0,
                vibration: data.vibration || 0,
                pressure: data.pressure || 0,
                vibrationAlarm: data.vibrationAlarm || 0,
                timestamp: data.timestamp || Date.now()
            });
        }
    });
};
