/**
 * Service to interact with Blynk Cloud API
 * Doc: https://docs.blynk.io/en/blynk.cloud/get-datastream-value
 */


const ENV_TOKEN = import.meta.env.VITE_BLYNK_AUTH_TOKEN;

// Map your Virtual Pins here
const PINS = {
    FLOW_RATE: 'V0',
    TOTAL_USAGE: 'V1',
    LEAK_STATUS: 'V2',
    VIBRATION_RMS: 'V3',
    PRESSURE: 'V4',
    VIBRATION_ALARM: 'V5',
    VALVE: 'V6',
    RECALIBRATE: 'V10'
};

/**
 * Fetch a single pin value
 */
async function fetchPin(pin, token) {
    const activeToken = token || ENV_TOKEN;
    if (!activeToken) return 0;

    const url = `https://blynk.cloud/external/api/get?token=${activeToken}&${pin}`;
    try {
        const response = await fetch(url);
        if (!response.ok) return 0;
        const text = await response.text();
        return Number(text) || 0;
    } catch (e) {
        console.error(`Error fetching pin ${pin}:`, e);
        return 0;
    }
}

export async function fetchBlynkData(token) {
    const activeToken = token || ENV_TOKEN;
    if (!activeToken) {
        console.warn("Blynk Token not found (neither in .env nor passed)");
        return {
            flowRate: 0,
            totalUsage: 0,
            leakStatus: 0,
            vibration: 0,
            pressure: 0,
            vibrationAlarm: 0
        };
    }

    try {
        // Fetch pins in parallel for speed
        const [flow, total, leak, vib, press, alarm] = await Promise.all([
            fetchPin(PINS.FLOW_RATE, activeToken),
            fetchPin(PINS.TOTAL_USAGE, activeToken),
            fetchPin(PINS.LEAK_STATUS, activeToken),
            fetchPin(PINS.VIBRATION_RMS, activeToken),
            fetchPin(PINS.PRESSURE, activeToken),
            fetchPin(PINS.VIBRATION_ALARM, activeToken)
        ]);

        return {
            flowRate: flow,
            totalUsage: total,
            leakStatus: leak,
            vibration: vib,
            pressure: press,
            vibrationAlarm: alarm
        };

    } catch (error) {
        console.error("Failed to fetch Blynk data:", error);
        return null;
    }
}

/**
 * Send a command to a Virtual Pin
 */
export async function sendBlynkCommand(pin, value, token) {
    const activeToken = token || ENV_TOKEN;
    if (!activeToken) return;
    const url = `https://blynk.cloud/external/api/update?token=${activeToken}&${pin}=${value}`;
    try {
        await fetch(url);
    } catch (e) {
        console.error(`Error updating pin ${pin}:`, e);
    }
}

export { PINS };
