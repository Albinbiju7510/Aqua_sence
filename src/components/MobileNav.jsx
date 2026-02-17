
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Droplets } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function MobileNav() {
    const { logout } = useAuth();
    const location = useLocation();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const NavItem = ({ to, icon: Icon }) => {
        const isActive = location.pathname === to;
        return (
            <Link
                to={to}
                className={`p-3 rounded-xl transition-all duration-200 ${isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-slate-400'
                    }`}
            >
                <Icon size={24} />
            </Link>
        );
    };

    return (
        <div className="md:hidden fixed bottom-4 left-4 right-4 h-16 glass-card flex items-center justify-around z-50">
            <NavItem to="/dashboard" icon={LayoutDashboard} />

            <div className="p-2 bg-linear-to-br from-cyan-400 to-blue-600 rounded-lg text-white -mt-8 shadow-lg shadow-cyan-500/30">
                <Droplets size={24} />
            </div>

            <NavItem to="/about" icon={Users} />

            <button
                onClick={handleLogout}
                className="p-3 text-red-400 hover:text-red-300 transition-colors"
            >
                <LogOut size={24} />
            </button>
        </div>
    );
}
