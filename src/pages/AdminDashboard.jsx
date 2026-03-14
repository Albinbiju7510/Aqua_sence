
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Settings,
    Wrench,
    Bell,
    FileText,
    Save,
    RefreshCcw,
    CheckCircle,
    Clock,
    AlertTriangle,
    Download,
    User,
    Shield,
    Trash2,
    BarChart2,
    PieChart
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { generateTotalSummary } from '../services/reportGenerator';
import { db } from '../services/firebase';
import { sendBlynkCommand, PINS } from '../services/blynkService';
import {
    doc,
    getDoc,
    setDoc,
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    updateDoc
} from 'firebase/firestore';

export default function AdminDashboard() {
    const [thresholds, setThresholds] = useState({
        flowLimit: 0.3,
        leakDuration: 10,
        vibrationLimit: 1.0,
        pressureLimit: 50
    });
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [userSearch, setUserSearch] = useState('');
    const [userToken, setUserToken] = useState(null);
    const isSuperAdmin = currentUser?.email === 'albinbiju75100@gmail.com';

    useEffect(() => {
        // Fetch User Token for Blynk Commands
        const fetchUserConfig = async () => {
            if (currentUser) {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    setUserToken(userDoc.data().blynkToken);
                }
            }
        };
        fetchUserConfig();
    }, [currentUser]);

    const handleSystemCommand = async (type, value) => {
        if (!userToken) {
            alert("No Blynk Token found in your profile. Please add one in Settings.");
            return;
        }

        try {
            const pin = PINS[type];
            await sendBlynkCommand(pin, value, userToken);
            alert(`${type} command sent successfully!`);
        } catch (error) {
            console.error("Error sending command:", error);
            alert("Failed to send command.");
        }
    };

    useEffect(() => {
        // 1. Fetch Thresholds
        const fetchThresholds = async () => {
            const settingsDoc = await getDoc(doc(db, "system", "settings"));
            if (settingsDoc.exists()) {
                setThresholds(settingsDoc.data());
            }
        };

        // 2. Subscribe to Alerts for Maintenance
        const q = query(collection(db, "alerts"), orderBy("timestamp", "desc"), limit(20));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const alertsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAlerts(alertsData);
            setLoading(false);
        });

        // 3. Fetch Users for Super Admin
        if (isSuperAdmin) {
            const usersQ = query(collection(db, "users"), limit(50));
            const unsubscribeUsers = onSnapshot(usersQ, (snapshot) => {
                const usersData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setUsers(usersData);
            });
            fetchThresholds();
            return () => {
                unsubscribe();
                unsubscribeUsers();
            };
        }

        fetchThresholds();
        return () => unsubscribe();
    }, []);

    const handleSaveThresholds = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await setDoc(doc(db, "system", "settings"), thresholds);
            alert("Settings updated successfully!");
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings.");
        }
        setSaving(false);
    };

    const updateAlertStatus = async (alertId, newStatus) => {
        try {
            await updateDoc(doc(db, "alerts", alertId), {
                maintenanceStatus: newStatus
            });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleToggleRole = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        try {
            await updateDoc(doc(db, "users", userId), { role: newRole });
        } catch (error) {
            console.error("Error updating role:", error);
        }
    };

    const handleExportSummary = async () => {
        try {
            const doc = await generateTotalSummary(alerts, thresholds);
            doc.save(`AquaSense_Total_Summary_${new Date().toLocaleDateString()}.pdf`);
        } catch (error) {
            console.error("Error generating summary:", error);
        }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.name?.toLowerCase().includes(userSearch.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <RefreshCcw className="animate-spin text-primary" size={48} />
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Admin Control Panel</h1>
                    <p className="text-text-muted mt-1 uppercase tracking-widest text-[10px] font-bold">System Management & Configuration</p>
                </div>
                {isSuperAdmin && (
                    <button
                        onClick={handleExportSummary}
                        className="btn-secondary flex items-center gap-2 text-xs font-bold border-primary/20 text-primary hover:bg-primary/10"
                    >
                        <Download size={16} /> Download Total Summary
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Section 1: System Settings */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card p-8 border hover:border-primary/20 transition-all"
                >
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-primary/10 rounded-xl text-primary">
                            <Settings size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-white">System Configuration</h2>
                    </div>

                    <form onSubmit={handleSaveThresholds} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted">Flow Threshold (L/min)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={thresholds.flowLimit}
                                onChange={(e) => setThresholds({ ...thresholds, flowLimit: parseFloat(e.target.value) })}
                                className="input-field"
                            />
                            <p className="text-[10px] text-text-muted italic">Flow above this value triggers a potential leak event.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted">Leak Duration Threshold (Minutes)</label>
                            <input
                                type="number"
                                value={thresholds.leakDuration}
                                onChange={(e) => setThresholds({ ...thresholds, leakDuration: parseInt(e.target.value) })}
                                className="input-field"
                            />
                            <p className="text-[10px] text-text-muted italic">Continuous flow must persist for this long to confirm a leak.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted">Pressure Threshold (PSI)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={thresholds.pressureLimit || 50}
                                onChange={(e) => setThresholds({ ...thresholds, pressureLimit: parseFloat(e.target.value) })}
                                className="input-field"
                            />
                            <p className="text-[10px] text-text-muted italic">Pressure above this value triggers a potential leak event.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted">Vibration Sensitivity (g-force)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={thresholds.vibrationLimit}
                                onChange={(e) => setThresholds({ ...thresholds, vibrationLimit: parseFloat(e.target.value) })}
                                className="input-field"
                            />
                            <p className="text-[10px] text-text-muted italic">Values above this trigger an abnormal vibration warning.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-4"
                        >
                            {saving ? <RefreshCcw className="animate-spin" size={20} /> : <><Save size={20} /> Apply Configuration</>}
                        </button>
                    </form>
                </motion.div>

                {/* Section 2: Maintenance Management */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card p-8 border hover:border-orange-500/20 transition-all flex flex-col"
                >
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500">
                            <Bell size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-white">Maintenance Hub</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar max-h-[500px]">
                        {alerts.length > 0 ? alerts.map((alert) => (
                            <div key={alert.id} className="bg-bg-dark/50 rounded-xl p-4 border border-white/5 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle size={16} className="text-orange-400" />
                                        <span className="text-sm font-bold text-white">{alert.type}</span>
                                    </div>
                                    <span className="text-[10px] text-text-muted font-mono">{new Date(alert.timestamp).toLocaleString()}</span>
                                </div>
                                <p className="text-xs text-text-muted">{alert.message}</p>

                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(alert.maintenanceStatus)}
                                        <span className="text-[10px] font-bold uppercase tracking-widest">
                                            {alert.maintenanceStatus || 'Pending'}
                                        </span>
                                    </div>
                                    <select
                                        className="bg-bg-dark text-[10px] rounded border border-white/10 px-2 py-1 outline-none focus:border-primary/50"
                                        value={alert.maintenanceStatus || 'pending'}
                                        onChange={(e) => updateAlertStatus(alert.id, e.target.value)}
                                    >
                                        <option value="pending">Mark Pending</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-20 text-text-muted">
                                <CheckCircle size={40} className="mx-auto mb-4 opacity-20" />
                                <p>No maintenance alerts currently active.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Section 3: Priority System Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 border border-primary/20 bg-primary/5"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Wrench className="text-primary" size={20} />
                        <h3 className="font-bold text-white">Valve Control</h3>
                    </div>
                    <p className="text-xs text-text-muted mb-6">Physical override for the main inflow valve. Use in case of emergency bypass.</p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => handleSystemCommand('VALVE', 1)}
                            className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 py-2 rounded-lg text-xs font-bold transition-all"
                        >
                            Emergency Open
                        </button>
                        <button
                            onClick={() => handleSystemCommand('VALVE', 0)}
                            className="bg-danger/20 hover:bg-danger/30 text-danger border border-danger/30 py-2 rounded-lg text-xs font-bold transition-all"
                        >
                            Emergency Close
                        </button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-6 border border-cyan-500/20 bg-cyan-500/5"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <RefreshCcw className="text-cyan-400" size={20} />
                        <h3 className="font-bold text-white">Sensor Calibration</h3>
                    </div>
                    <p className="text-xs text-text-muted mb-6">Reset flow sensor baseline and vibration sensitivity to current environment.</p>
                    <button
                        onClick={() => handleSystemCommand('RECALIBRATE', 1)}
                        className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 py-2 rounded-lg text-xs font-bold transition-all mt-auto"
                    >
                        Execute Recalibration
                    </button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-6 border border-amber-500/20 bg-amber-500/5"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="text-amber-500" size={20} />
                        <h3 className="font-bold text-white">System Diagnosis</h3>
                    </div>
                    <p className="text-xs text-text-muted mb-6">Perform a full hardware health check and verify Blynk cloud connectivity.</p>
                    <button
                        onClick={() => alert("Diagnostic mode initiated. Checking hardware components...")}
                        className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 border border-amber-500/30 py-2 rounded-lg text-xs font-bold transition-all mt-auto"
                    >
                        Run Connectivity Test
                    </button>
                </motion.div>
            </div>

            {/* Section 4: Super-Admin User Management */}
            {isSuperAdmin && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-8 border border-purple-500/20"
                >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                                <Shield size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">User Management</h2>
                                <p className="text-xs text-text-muted">Role-Based Access Control</p>
                            </div>
                        </div>
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="input-field max-w-xs py-2! pl-10!"
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                        />
                    </div>

                    <div className="bg-bg-dark/30 rounded-2xl overflow-hidden border border-white/5">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-text-muted">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Current Role</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-xs text-white">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-white/2 transition-colors">
                                        <td className="px-6 py-4 font-bold">{user.name || 'N/A'}</td>
                                        <td className="px-6 py-4 text-text-muted">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-white/5 text-slate-400'}`}>
                                                {user.role?.toUpperCase() || 'USER'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleToggleRole(user.id, user.role)}
                                                className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${user.role === 'admin' ? 'border-danger/20 text-danger hover:bg-danger/10' : 'border-primary/20 text-primary hover:bg-primary/10'}`}
                                            >
                                                {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

function ReportRow({ id, date, status }) {
    return (
        <tr className="hover:bg-white/2 transition-colors">
            <td className="px-6 py-4 font-mono text-primary">{id}</td>
            <td className="px-6 py-4 text-text-muted">{date}</td>
            <td className="px-6 py-4">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${status.includes('Critical') ? 'bg-danger/10 text-danger' :
                    status.includes('Warning') ? 'bg-orange-500/10 text-orange-500' :
                        'bg-primary/10 text-primary'
                    }`}>
                    {status}
                </span>
            </td>
            <td className="px-6 py-4 text-right">
                <button className="p-2 hover:bg-primary/10 rounded-lg text-text-muted hover:text-primary transition-all">
                    <Download size={16} />
                </button>
            </td>
        </tr>
    );
}

function getStatusIcon(status) {
    switch (status) {
        case 'resolved': return <CheckCircle size={14} className="text-primary" />;
        case 'in-progress': return <Clock size={14} className="text-orange-400" />;
        default: return <AlertTriangle size={14} className="text-orange-400" anchor="pending" />;
    }
}
