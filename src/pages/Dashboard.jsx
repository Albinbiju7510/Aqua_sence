import { useState, useEffect } from 'react';
import { fetchBlynkData, sendBlynkCommand, PINS } from '../services/blynkService';
import { Activity, Droplets, AlertTriangle, Waves, Zap, RefreshCw, Cpu, Bell } from 'lucide-react';
import { generateReport } from '../services/reportGenerator';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { subscribeRTDBData } from '../services/sensorService';

// Widgets
import ValueWidget from '../components/widgets/ValueWidget';
import GaugeWidget from '../components/widgets/GaugeWidget';
import ChartWidget from '../components/widgets/ChartWidget';
import SwitchWidget from '../components/widgets/SwitchWidget';

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
    const [dataSource, setDataSource] = useState('blynk'); // 'blynk' or 'simulated'

    // Control States
    const [mainValve, setMainValve] = useState(true);
    const [leakDetected, setLeakDetected] = useState(false);
    const [leakStartTime, setLeakStartTime] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [isDemoSimulating, setIsDemoSimulating] = useState(false);
    const [demoStep, setDemoStep] = useState(0);
    const { currentUser } = useAuth();
    const [userToken, setUserToken] = useState(null);

    useEffect(() => {
        const fetchUserToken = async () => {
            if (currentUser) {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    setUserToken(userDoc.data().blynkToken);
                }
            }
        };
        fetchUserToken();
    }, [currentUser]);

    useEffect(() => {
        let demoTimers = [];

        if (dataSource === 'simulated' && isDemoSimulating) {
            // Demo Mode Workflow simulation
            const startTimer = setTimeout(() => {
                const simulatedData = {
                    flowRate: 0.8,
                    totalUsage: 25.4, // Static for demo start
                    leakStatus: 0,
                    vibration: 0.05,
                    pressure: 42,
                    vibrationAlarm: 0,
                    timestamp: Date.now()
                };

                setCurrentData(simulatedData);
                setDemoStep(1); // Leak Detecting

                // Trigger Leak Detected after 5s
                const leakTimer = setTimeout(() => {
                    setLeakDetected(true);
                    setDemoStep(2); // Alert Sent

                    const monitorTimer = setTimeout(() => setDemoStep(3), 2000); // System Monitoring
                    const mitigationTimer = setTimeout(() => setDemoStep(4), 4000); // Mitigation

                    demoTimers.push(monitorTimer, mitigationTimer);
                }, 5000);

                demoTimers.push(leakTimer);
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
                }
            };
            fetchData();
            const intervalId = setInterval(fetchData, 3000);
            return () => clearInterval(intervalId);
        }
    }, [userToken, dataSource, isDemoSimulating]);

    // Leak Detection Logic (Persistence)
    useEffect(() => {
        if (isDemoSimulating) return; // Handled by demo workflow

        const FLOW_THRESHOLD = 0.3;
        const PERSISTENCE_MS = 600000; // 10 minutes

        if (currentData.flowRate > FLOW_THRESHOLD) {
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
    }, [currentData.flowRate, leakStartTime, leakDetected, isDemoSimulating]);

    // Logging Alert
    useEffect(() => {
        if (leakDetected || currentData.vibrationAlarm === 1) {
            const now = new Date();
            const timestamp = now.toLocaleString('en-GB', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            }).replace(/\//g, '-').replace(',', '');

            const type = leakDetected ? 'Leak Detected' : 'Vibration Alarm';
            const message = type === 'Leak Detected'
                ? `Leak detected | Flow: ${currentData.flowRate.toFixed(1)} L/min | Pressure: ${currentData.pressure.toFixed(1)} PSI | Vibration: ${currentData.vibration.toFixed(3)}`
                : `Abnormal Vibration Detected | Valve: ${mainValve ? 'Open' : 'Closed'} | Vibration: ${currentData.vibration.toFixed(3)}`;

            const newAlert = {
                timestamp: now.getTime(),
                type: type,
                message: message,
                formatted: `[${timestamp}] ${type} | Flow: ${currentData.flowRate.toFixed(1)} L/min | Pressure: ${currentData.pressure.toFixed(1)} PSI | Vibration: ${currentData.vibration.toFixed(3)}`
            };

            // Avoid duplicate logs for same event if triggered rapidly
            setAlerts(prev => {
                const lastAlert = prev[0];
                if (lastAlert && lastAlert.type === type && (now.getTime() - lastAlert.timestamp) < 5000) {
                    return prev;
                }
                return [newAlert, ...prev];
            });
        }
    }, [leakDetected, currentData.vibrationAlarm]);

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

    const isLeak = currentData.leakStatus === 1;
    const isVibrationAlarm = currentData.vibrationAlarm === 1;

    return (
        <div className="animate-fade-in pb-20 md:pb-0 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Pipeline Monitor</h2>
                    <p className="text-text-muted text-sm flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full animate-pulse ${dataSource === 'simulated' ? 'bg-amber-500' : 'bg-primary'}`}></span>
                        {dataSource === 'simulated' ? 'Simulation Mode' : 'Blynk Live Link'} • Last Sync: {new Date(currentData.timestamp).toLocaleTimeString()}
                    </p>
                </div>
                <div className="flex items-center gap-3">
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
                    <button
                        onClick={() => generateReport(history, alerts)}
                        className="hidden md:block bg-primary hover:bg-[#27ae60] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Export Report
                    </button>
                </div>
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
                            <div className="text-sm opacity-90">Abnormal water flow persists. Critical leak threshold exceeded.</div>
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
                            <div className="text-sm opacity-90">Warning: Excessive mechanical vibration detected. Check pipe mounting.</div>
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
                            { step: 1, label: 'Leak Detected', icon: Droplets },
                            { step: 2, label: 'Alert Sent', icon: Bell },
                            { step: 3, label: 'System Monitoring', icon: Activity },
                            { step: 4, label: 'Mitigation Steps', icon: Zap }
                        ].map((item, idx) => (
                            <div key={idx} className={`flex flex-col items-center gap-2 transition-all duration-700 relative z-10 ${demoStep >= item.step ? 'opacity-100 scale-110' : 'opacity-30 scale-90'}`}>
                                <div className={`p-3 rounded-full shadow-lg ${demoStep >= item.step ? 'bg-amber-500 text-white ring-4 ring-amber-500/30' : 'bg-card-dark text-text-muted'}`}>
                                    <item.icon size={24} />
                                </div>
                                <span className="text-xs font-semibold">{item.label}</span>
                            </div>
                        ))}
                        {/* Progress Line */}
                        <div className="absolute top-6 left-0 w-full h-[2px] bg-[#333] hidden md:block">
                            <div
                                className="h-full bg-amber-500 transition-all duration-1000"
                                style={{ width: `${Math.max(0, (demoStep - 1) * 33.3)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Widget Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Primary Metrics */}
                <div className="col-span-2 lg:col-span-1">
                    <ValueWidget
                        title="Flow Rate"
                        value={currentData.flowRate.toFixed(1)}
                        unit="L/min"
                        icon={Waves}
                        color="#2ecc71"
                    />
                </div>

                <div className="col-span-2 lg:col-span-1">
                    <ValueWidget
                        title="Total Usage"
                        value={currentData.totalUsage.toFixed(1)}
                        unit="L"
                        icon={Droplets}
                        color="#2980b9"
                    />
                </div>

                <div className="col-span-2 lg:col-span-1">
                    <div className="blynk-card flex flex-col items-center justify-center h-full min-h-[140px] relative overflow-hidden">
                        <div className={`absolute inset-0 opacity-5 ${isLeak ? 'bg-danger animate-pulse' : 'bg-primary'}`}></div>
                        <div className="mb-2 text-text-muted text-xs font-semibold uppercase tracking-wider relative">
                            System Health
                        </div>
                        <div className={`text-2xl font-bold relative ${leakDetected ? 'text-danger' : 'text-primary'}`}>
                            {leakDetected ? 'CRITICAL' : 'OPTIMAL'}
                        </div>
                        <div className="mt-2 relative">
                            {leakDetected ? <AlertTriangle size={40} className="text-danger" /> : <Zap size={40} className="text-primary" />}
                        </div>
                    </div>
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
                <div className="col-span-2 lg:col-span-2">
                    <SwitchWidget
                        title="Main Valve Control"
                        isOn={mainValve}
                        onToggle={() => setMainValve(!mainValve)}
                        color="#2ecc71"
                    />
                </div>

                {/* Mitigation Workflow Section */}
                {(leakDetected || (isDemoSimulating && demoStep >= 4)) && (
                    <div className="col-span-2 space-y-4">
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
                <div className="col-span-2 lg:col-span-4">
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
                <div className="col-span-2 lg:col-span-3">
                    <ChartWidget
                        title="Real-time Flow Stream"
                        data={history}
                        dataKey="flowRate"
                        color="#2ecc71"
                    />
                </div>

                <div className="col-span-2 lg:col-span-1">
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
