
import { Link } from 'react-router-dom';
import { Droplets } from 'lucide-react';

export default function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
            <div className="container-wide h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Droplets className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-xl font-bold font-inter text-slate-900 tracking-tight">AquaSense</span>
                </Link>

                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                        Log In
                    </Link>
                    <Link to="/signup" className="relative overflow-hidden bg-linear-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-300 text-sm">
                        Get Started
                    </Link>
                </div>
            </div>
        </nav>
    );
}
