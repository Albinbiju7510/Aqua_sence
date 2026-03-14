import { useState, useEffect, useRef } from 'react';
import { fetchBlynkData, sendBlynkCommand, PINS } from '../services/blynkService';
import { Activity, Droplets, AlertTriangle, Waves, Zap, RefreshCw, Cpu, Bell } from 'lucide-react';
import { generateReport } from '../services/reportGenerator';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { subscribeRTDBData } from '../services/sensorService';

// Widgets
import ValueWidget from '../components/widgets/ValueWidget';
import GaugeWidget from '../components/widgets/GaugeWidget';
import ChartWidget from '../components/widgets/ChartWidget';
import SwitchWidget from '../components/widgets/SwitchWidget';
// Recharts components removed (not needed in Dashboard directly)

export default function Dashboard() {
    const [currentData, setCurrentData] = useState({
        flowRate: 0,
        totalUsage: 0,
        leakStatus: 0,
        vibration: 0,
        pressure: 0,
        vibrationAlarm: 0,
        timestamp: Date.now()
    });
    const [history, setHistory] = useState([]);
    const [isCalibrating, setIsCalibrating] = useState(false);
    const [dataSource, setDataSource] = useState(import.meta.env.VITE_BLYNK_AUTH_TOKEN ? 'blynk' : 'simulated'); // 'blynk' or 'simulated'

    // Control States
    const [mainValve, setMainValve] = useState(true);
    const [leakDetected, setLeakDetected] = useState(false);
    const [leakStartTime, setLeakStartTime] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [isDemoSimulating, setIsDemoSimulating] = useState(false);
    const [demoStep, setDemoStep] = useState(0);
    const [thresholds, setThresholds] = useState({
        flowLimit: 0.3,
        leakDuration: 10,
        vibrationLimit: 1.0,
        pressureLimit: 50
    });
    const { currentUser } = useAuth();
    const [userToken, setUserToken] = useState(null);
    const [timeRange, setTimeRange] = useState('24h');
    const [isConnected, setIsConnected] = useState(false);
    const lastAlertTime = useRef({});

    useEffect(() => {
        const fetchConfig = async () => {
            if (currentUser) {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    const token = userDoc.data().blynkToken;
                    setUserToken(token);
                    if (token) setDataSource('blynk');
                }

                // Fetch System Settings (Thresholds)
                const settingsDoc = await getDoc(doc(db, "system", "settings"));
                if (settingsDoc.exists()) {
                    setThresholds(settingsDoc.data());
                }
            }
        };
        fetchConfig();
    }, [currentUser]);

    useEffect(() => {
        let demoTimers = [];

        if (dataSource === 'simulated' && isDemoSimulating) {
            // Demo Mode Workflow simulation: 6 steps
            const startTimer = setTimeout(() => {
                const simulatedData = {
                    flowRate: thresholds.flowLimit + 1.2,
                    totalUsage: 25.4,
                    leakStatus: 0,
                    vibration: 0.05,
                    pressure: (thresholds.pressureLimit || 50) + 10,
                    vibrationAlarm: 0,
                    timestamp: Date.now()
                };

                setCurrentData(simulatedData);
                setDemoStep(1); // 1. Sensor data monitored

                demoTimers.push(setTimeout(() => {
                    setDemoStep(2); // 2. Threshold exceeded

                    demoTimers.push(setTimeout(() => {
                        setLeakDetected(true);
                        setDemoStep(3); // 3. Leak detected

                        demoTimers.push(setTimeout(() => {
                            setDemoStep(4); // 4. Alert generated

                            demoTimers.push(setTimeout(() => {
                                setDemoStep(5); // 5. Notification displayed

                                demoTimers.push(setTimeout(() => {
                                    setDemoStep(6); // 6. Maintenance action suggested
                                }, 2000));
                            }, 2000));
                        }, 2000));
                    }, 2000));
                }, 2000));

            }, 1000);

            demoTimers.push(startTimer);

            return () => {
                demoTimers.forEach(t => clearTimeout(t));
                // Revert simulation state if stopped
                if (!isDemoSimulating) {
                    setLeakDetected(false);
                    setDemoStep(0);
                }
            };
        } else if (dataSource === 'simulated') {
            const unsubscribe = subscribeRTDBData((newData) => {
                const now = Date.now();
                setCurrentData({ ...newData, timestamp: now });
                setHistory(prev => {
                    const newHist = [...prev, {
                        ...newData,
                        time: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    }];
                    if (newHist.length > 20) newHist.shift();
                    return newHist;
                });
            });
            return () => unsubscribe();
        } else {
            const fetchData = async () => {
                const data = await fetchBlynkData(userToken);
                if (data) {
                    setIsConnected(true);
                    const now = Date.now();
                    const newData = { ...data, timestamp: now };
                    setCurrentData(newData);
                    setHistory(prev => {
                        const newHist = [...prev, {
                            ...newData,
                            time: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        }];
                        if (newHist.length > 20) newHist.shift();
                        return newHist;
                    });
                } else {
                    setIsConnected(false);
                }
            };
            fetchData();
            const intervalId = setInterval(fetchData, 1000);
            return () => clearInterval(intervalId);
        }
    }, [userToken, dataSource, isDemoSimulating, timeRange]);

    // Handle Time Range change (Mock Data for Demo/History)
    useEffect(() => {
        if (timeRange === '24h') return;

        const generateHistory = () => {
            const points = timeRange === '7d' ? 50 : 100;
            const now = Date.now();
            const dayMs = 24 * 60 * 60 * 1000;
            const step = timeRange === '7d' ? (7 * dayMs / points) : (30 * dayMs / points);

            return Array.from({ length: points }).map((_, i) => ({
                flowRate: 0.1 + Math.random() * 0.4,
                totalUsage: 200 + (i * 1.5),
                timestamp: now - (points - i) * step,
                time: timeRange === '7d'
                    ? new Date(now - (points - i) * step).toLocaleDateString([], { weekday: 'short' })
                    : new Date(now - (points - i) * step).toLocaleDateString([], { month: 'short', day: 'numeric' })
            }));
        };

        setHistory(generateHistory());
    }, [timeRange]);

    // Leak & Vibration Detection Logic (Persistence + Thresholds)
    useEffect(() => {
        if (isDemoSimulating) return; // Handled by demo workflow

        const FLOW_THRESHOLD = thresholds.flowLimit;
        const PRESSURE_THRESHOLD = thresholds.pressureLimit || 50;
        const PERSISTENCE_MS = thresholds.leakDuration * 60000; // Convert minutes to ms
        const VIB_THRESHOLD = thresholds.vibrationLimit;

        // Flow Leak Logic
        if (currentData.flowRate >= FLOW_THRESHOLD || currentData.pressure >= PRESSURE_THRESHOLD) {
            if (!leakStartTime) {
                setLeakStartTime(Date.now());
            } else if (Date.now() - leakStartTime > PERSISTENCE_MS) {
                if (!leakDetected) {
                    setLeakDetected(true);
                }
            }
        } else {
            setLeakStartTime(null);
            setLeakDetected(false);
        }

        // Additional Vibration Check based on Admin Threshold
        const isVibRmsHigh = currentData.vibration >= VIB_THRESHOLD;
        const isVibAlarmHigh = currentData.vibrationAlarm === 1;

        // We do not artificially mutate currentData.vibrationAlarm here 
        // to avoid infinite loops and false persistence.

    }, [currentData.flowRate, currentData.pressure, currentData.vibration, currentData.vibrationAlarm, leakStartTime, leakDetected, isDemoSimulating, thresholds]);

    const isVibrationAlarm = currentData.vibration >= thresholds.vibrationLimit || currentData.vibrationAlarm === 1;

    // Logging Alert
    useEffect(() => {
        if (leakDetected || isVibrationAlarm) {
            const now = new Date();
            const timeMs = now.getTime();
            const type = leakDetected ? 'Leak Detected' : 'Vibration Alarm';

            if (lastAlertTime.current[type] && (timeMs - lastAlertTime.current[type]) < 5000) {
                return; // Avoid duplicate logging within 5s
            }
            lastAlertTime.current[type] = timeMs;

            const timestamp = now.toLocaleString('en-GB', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            }).replace(/\//g, '-').replace(',', '');

            const message = type === 'Leak Detected'
                ? `Leak detected | Flow: ${currentData.flowRate.toFixed(1)} L/min | Pressure: ${currentData.pressure.toFixed(1)} PSI | Vibration: ${currentData.vibration.toFixed(3)}`
                : `Abnormal Vibration Detected | Valve: ${mainValve ? 'Open' : 'Closed'} | Vibration: ${currentData.vibration.toFixed(3)}`;

            const newAlert = {
                timestamp: timeMs,
                type: type,
                message: message,
                formatted: `[${timestamp}] ${type} | Flow: ${currentData.flowRate.toFixed(1)} L/min | Pressure: ${currentData.pressure.toFixed(1)} PSI | Vibration: ${currentData.vibration.toFixed(3)}`
            };

            setAlerts(prev => [newAlert, ...prev]);

            // Add to Firestore so Admin Control Panel gets it
            addDoc(collection(db, "alerts"), {
                ...newAlert,
                maintenanceStatus: 'pending'
            }).catch(console.error);
        }
    }, [leakDetected, isVibrationAlarm, mainValve, currentData]);

    const handleDemoMode = () => {
        if (dataSource !== 'simulated') {
            setDataSource('simulated');
        }
        setIsDemoSimulating(!isDemoSimulating);
        setLeakDetected(false);
        setLeakStartTime(null);
        setDemoStep(0);
    };

    const handleRecalibrate = async () => {
        setIsCalibrating(true);
        await sendBlynkCommand(PINS.RECALIBRATE, 1, userToken);
        // Wait 5 seconds for calibration to finish on hardware
        setTimeout(() => {
            setIsCalibrating(false);
            sendBlynkCommand(PINS.RECALIBRATE, 0, userToken);
        }, 5000);
    };

    const handleToggleValve = async () => {
        const newState = !mainValve;
        setMainValve(newState);
        // Send command to Blynk
        await sendBlynkCommand(PINS.VALVE, newState ? 1 : 0, userToken);
    };

    const isLeak = currentData.leakStatus === 1;

    const getConnectionStatus = () => {
        if (dataSource === 'simulated') return { label: 'Simulation Mode', color: 'text-amber-500', dot: 'bg-amber-500' };
        if (userToken) {
            return isConnected
                ? { label: 'Live Link Active', color: 'text-green-500', dot: 'bg-green-500' }
                : { label: 'Live Link Not Connected', color: 'text-red-500', dot: 'bg-red-500' };
        }
        return { label: 'Cloud Mode (Firebase)', color: 'text-blue-400', dot: 'bg-blue-400' };
    };

    const status = getConnectionStatus();

    return (
        <div className="animate-fade-in pb-20 md:pb-0 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Pipeline Monitor</h2>
                    <p className="text-text-muted text-sm flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full animate-pulse ${status.dot}`}></span>
                        <span className={`font-bold ${status.color}`}>{status.label}</span> • Last Sync: {new Date(currentData.timestamp).toLocaleTimeString()}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setDataSource(prev => prev === 'blynk' ? 'simulated' : 'blynk')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${dataSource === 'blynk'
                            ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(46,204,113,0.2)]'
                            : 'bg-card-dark border-[#333] text-text-muted hover:text-white'
                            }`}
                    >
                        <Zap size={16} />
                        {dataSource === 'blynk' ? 'Live Link Active' : 'Go Live'}
                    </button>
                    <button
                        onClick={handleDemoMode}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${isDemoSimulating
                            ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                            : 'bg-card-dark border-[#333] text-text-muted hover:text-white'
                            }`}
                    >
                        <Cpu size={16} />
                        {isDemoSimulating ? 'Stop Demo' : 'Demo Mode'}
                    </button>
                    <button
                        onClick={handleRecalibrate}
                        disabled={isCalibrating}
                        className={`flex items-center gap-2 bg-card-dark hover:bg-[#333] text-white px-4 py-2 rounded-lg text-sm font-medium border border-[#333] transition-all ${isCalibrating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <RefreshCw size={16} className={isCalibrating ? 'animate-spin' : ''} />
                        {isCalibrating ? 'Calibrating...' : 'Recalibrate'}
                    </button>
                </div>
            </div>

            {/* Time Scale Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card-dark/40 p-2 rounded-xl border border-white/5">
                <div className="flex items-center gap-1">
                    {['24h', '7d', '30d'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeRange === range
                                ? 'bg-primary text-white shadow-lg'
                                : 'text-text-muted hover:text-white hover:bg-white/5'}`}
                        >
                            {range.toUpperCase()}
                        </button>
                    ))}
                </div>
                <div className="text-[10px] text-text-muted font-mono uppercase tracking-widest hidden md:block">
                    Historical Analysis Mode: {timeRange === '24h' ? 'High Precision' : 'Aggregated Trends'}
                </div>
                <button
                    onClick={() => generateReport(history, alerts)}
                    className="bg-primary hover:bg-[#27ae60] text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors"
                >
                    Export Report
                </button>
            </div>

            {/* Alert Banners */}
            <div className="space-y-4 mb-6">
                {leakDetected && (
                    <div className="bg-danger/10 border border-danger/30 text-danger p-4 rounded-xl flex items-center gap-4 animate-pulse">
                        <div className="bg-danger rounded-full p-2">
                            <AlertTriangle size={24} className="text-white" />
                        </div>
                        <div>
                            <div className="font-bold text-lg">Leak Detected</div>
                            <div className="text-sm opacity-90">Abnormal fluid dynamics persist. Thresholds Exceeded - Flow limit: {thresholds.flowLimit} L/min, Pressure limit: {thresholds.pressureLimit || 50} PSI.</div>
                        </div>
                    </div>
                )}
                {isVibrationAlarm && (
                    <div className="bg-warning/10 border border-warning/30 text-warning p-4 rounded-xl flex items-center gap-4 animate-shake">
                        <div className="bg-warning rounded-full p-2">
                            <Activity size={24} className="text-white" />
                        </div>
                        <div>
                            <div className="font-bold text-lg">Abnormal Vibration Detected</div>
                            <div className="text-sm opacity-90">Warning: Excessive mechanical vibration detected. Limit exceeded: {thresholds.vibrationLimit} g.</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Demo Workflow Section */}
            {isDemoSimulating && (
                <div className="blynk-card p-6 border-amber-500/30 bg-amber-500/5">
                    <h3 className="text-amber-500 font-bold mb-4 flex items-center gap-2">
                        <Cpu size={20} className="animate-pulse" /> Demo Simulation Workflow
                    </h3>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative">
                        {[
                            { step: 1, label: 'Sensor data monitored', icon: Activity },
                            { step: 2, label: 'Threshold exceeded', icon: Zap },
                            { step: 3, label: 'Leak detected', icon: Droplets },
                            { step: 4, label: 'Alert generated', icon: Bell },
                            { step: 5, label: 'Notification displayed', icon: AlertTriangle },
                            { step: 6, label: 'Action suggested', icon: Cpu }
                        ].map((item, idx) => (
                            <div key={idx} className={`flex flex-col items-center gap-2 transition-all duration-700 relative z-10 ${demoStep >= item.step ? 'opacity-100 scale-110' : 'opacity-30 scale-90'}`}>
                                <div className={`p-3 rounded-full shadow-lg ${demoStep >= item.step ? 'bg-amber-500 text-white ring-4 ring-amber-500/30' : 'bg-card-dark text-text-muted'}`}>
                                    <item.icon size={24} />
                                </div>
                                <span className="text-xs font-semibold text-center max-w-[80px] leading-tight">{item.label}</span>
                            </div>
                        ))}
                        {/* Progress Line */}
                        <div className="absolute top-6 left-0 w-full h-[2px] bg-[#333] hidden md:block">
                            <div
                                className="h-full bg-amber-500 transition-all duration-1000"
                                style={{ width: `${Math.max(0, (demoStep - 1) * 20)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Widget Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Primary Metrics */}
                <div className="col-span-1">
                    <ValueWidget
                        title="Flow Rate"
                        value={currentData.flowRate.toFixed(1)}
                        unit="L/min"
                        icon={Waves}
                        color="#2ecc71"
                    />
                </div>

                <div className="col-span-1">
                    <ValueWidget
                        title="Total Usage"
                        value={currentData.totalUsage.toFixed(1)}
                        unit="L"
                        icon={Droplets}
                        color="#2980b9"
                    />
                </div>

                <div className="col-span-1">
                    <ValueWidget
                        title="Vibration"
                        value={currentData.vibration.toFixed(3)}
                        unit="g"
                        icon={Activity}
                        color={isVibrationAlarm ? "#e74c3c" : "#f1c40f"}
                    />
                </div>

                <div className="col-span-1">
                    <ValueWidget
                        title="Pressure"
                        value={currentData.pressure.toFixed(1)}
                        unit="PSI"
                        icon={Zap}
                        color="#9b59b6"
                    />
                </div>

                {/* Controls */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2">
                    <SwitchWidget
                        title="Main Valve Control"
                        isOn={mainValve}
                        onToggle={handleToggleValve}
                        color="#2ecc71"
                    />
                </div>

                {/* Mitigation Workflow Section */}
                {(leakDetected || (isDemoSimulating && demoStep >= 6)) && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 space-y-4">
                        <div className="blynk-card p-6 border-danger/30">
                            <h3 className="text-danger font-bold mb-4 flex items-center gap-2">
                                <AlertTriangle size={20} /> Suggested Actions
                            </h3>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    "Reduce water supply",
                                    "Inspect pipeline",
                                    "Check pressure variations",
                                    "Monitor vibration levels"
                                ].map((action, i) => (
                                    <li key={i} className="flex items-center gap-3 bg-bg-dark/50 p-3 rounded-lg border border-white/5">
                                        <div className="w-2 h-2 rounded-full bg-danger"></div>
                                        <span className="text-sm text-slate-300">{action}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Recent Alerts Log */}
                <div className="col-span-1 md:col-span-2 lg:col-span-4">
                    <div className="blynk-card p-4">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <Activity size={18} className="text-primary" /> Recent Event Log
                        </h3>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                            {alerts.length === 0 ? (
                                <p className="text-text-muted text-sm italic">No security events logged.</p>
                            ) : (
                                alerts.map((alert, i) => (
                                    <div key={i} className="text-xs font-mono bg-bg-dark/80 p-2 rounded border border-white/5 text-slate-400">
                                        {alert.formatted}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Charts & Gauges */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2">
                    <ChartWidget
                        title="Real-time Flow Stream"
                        data={history}
                        dataKey="flowRate"
                        color="#2ecc71"
                    />
                </div>

                <div className="col-span-1 md:col-span-2 lg:col-span-2">
                    <ChartWidget
                        title="Vibration Trend"
                        data={history}
                        dataKey="vibration"
                        color="#f1c40f"
                    />
                </div>

                <div className="col-span-1 md:col-span-2 lg:col-span-1">
                    <GaugeWidget
                        title="Flow Intensity"
                        value={currentData.flowRate}
                        unit="L/min"
                        max={30}
                        color="#2ecc71"
                    />
                </div>

            </div>
        </div>
    );
}
