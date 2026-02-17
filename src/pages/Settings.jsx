import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { User, Shield, Bell, Settings as SettingsIcon, Save, Loader2 } from 'lucide-react';
// Internal imports

export default function Settings() {
    const { currentUser } = useAuth();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showToken, setShowToken] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            if (currentUser) {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                }
            }
            setLoading(false);
        };
        fetchUserData();
    }, [currentUser]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await updateDoc(doc(db, "users", currentUser.uid), {
                name: userData.name,
                blynkToken: userData.blynkToken || ''
            });
            setMessage({ type: 'success', text: 'Settings updated successfully!' });
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Failed to update profile.' });
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">System Settings</h2>
                <p className="text-text-muted text-sm">Manage your account and preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="blynk-card">
                        <div className="flex items-center gap-3 mb-6 border-b border-[#333] pb-4">
                            <User className="text-primary" size={20} />
                            <h3 className="font-bold text-white text-lg">Personal Information</h3>
                        </div>

                        {message.text && (
                            <div className={`mb-6 p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-danger/10 text-danger border border-danger/20'
                                }`}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Full Name</label>
                                    <input
                                        type="text"
                                        value={userData?.name || ''}
                                        onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                                        className="input-field pl-4"
                                        placeholder="Your Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Email Address</label>
                                    <input
                                        type="email"
                                        value={currentUser?.email || ''}
                                        disabled
                                        className="input-field pl-4 opacity-50 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-primary flex items-center justify-center gap-2"
                            >
                                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                Save Changes
                            </button>
                        </form>
                    </div>

                    <div className="blynk-card">
                        <div className="flex items-center gap-3 mb-6 border-b border-[#333] pb-4">
                            <Shield className="text-primary" size={20} />
                            <h3 className="font-bold text-white text-lg">Security</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-bg-dark/50 rounded-xl border border-white/5">
                                <div>
                                    <div className="text-sm font-bold text-white">Password</div>
                                    <div className="text-xs text-text-muted">Last changed 3 months ago</div>
                                </div>
                                <button className="text-primary text-sm font-medium hover:underline">Change Password</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preferences Sidebar */}
                <div className="space-y-6">
                    <div className="blynk-card">
                        <div className="flex items-center gap-3 mb-6 border-b border-[#333] pb-4">
                            <SettingsIcon className="text-primary" size={20} />
                            <h3 className="font-bold text-white text-lg">System</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Blynk Auth Token</label>
                                <div className="relative">
                                    <input
                                        type={showToken ? "text" : "password"}
                                        value={userData?.blynkToken || ''}
                                        onChange={(e) => setUserData({ ...userData, blynkToken: e.target.value })}
                                        className="input-field pl-4 pr-12"
                                        placeholder="Enter Blynk Token"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowToken(!showToken)}
                                        className="absolute right-3 top-2.5 text-primary text-xs font-medium"
                                    >
                                        {showToken ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                <p className="text-[10px] text-text-muted">Required for real-time sensor data.</p>
                            </div>
                            <button
                                onClick={handleUpdateProfile}
                                disabled={saving}
                                className="btn-primary w-full flex items-center justify-center gap-2 text-xs py-2"
                            >
                                {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                Update System
                            </button>
                        </div>
                    </div>

                    <div className="blynk-card">
                        <div className="flex items-center gap-3 mb-6 border-b border-[#333] pb-4">
                            <Bell className="text-primary" size={20} />
                            <h3 className="font-bold text-white text-lg">Alerts</h3>
                        </div>
                        <div className="space-y-3">
                            <ToggleItem label="Leak Detection Alerts" defaultChecked />
                            <ToggleItem label="Critical Pressure Alert" defaultChecked />
                            <ToggleItem label="Daily Usage Summary" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ToggleItem({ label, defaultChecked = false }) {
    const [checked, setChecked] = useState(defaultChecked);
    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-300">{label}</span>
            <button
                onClick={() => setChecked(!checked)}
                className={`w-10 h-5 rounded-full transition-colors relative ${checked ? 'bg-primary' : 'bg-[#333]'}`}
            >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${checked ? 'left-6' : 'left-1'}`} />
            </button>
        </div>
    );
}
