
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Droplets, LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function Sidebar() {
    const { currentUser, logout } = useAuth();
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            if (currentUser) {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                }
            }
        };
        fetchUserData();
    }, [currentUser]);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    return (
        <div className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-card-dark border-r border-[#333]">
            {/* Header */}
            <div className="p-6 flex flex-col items-center">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(46,204,113,0.3)]">
                    <Droplets size={24} className="text-white" />
                </div>
                <h1 className="text-xl font-bold text-white tracking-wider">AquaSense</h1>
                <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    <span className="text-xs text-text-muted font-mono">ONLINE</span>
                </div>
            </div>

            {/* User Profile */}
            <div className="px-6 py-4 mb-4">
                <div className="bg-bg-dark/50 rounded-xl p-4 border border-white/5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                        <User size={20} />
                    </div>
                    <div className="overflow-hidden">
                        <div className="text-sm font-bold text-white truncate">{userData?.name || 'User'}</div>
                        <div className="text-[10px] text-text-muted truncate lowercase">{currentUser?.email}</div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-4 py-2 space-y-1">
                <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavItem to="/about" icon={Users} label="About Team" />
                <NavItem to="/settings" icon={Settings} label="Settings" />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#333]">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                >
                    <LogOut size={18} />
                    Log Out
                </button>
            </div>
        </div>
    );
}

function NavItem({ to, icon: Icon, label }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-text-muted hover:text-white hover:bg-[#333]'
                }
            `}
        >
            <Icon size={20} />
            {label}
        </NavLink>
    );
}
