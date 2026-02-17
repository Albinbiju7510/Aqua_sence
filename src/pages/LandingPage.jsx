
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Droplets, Activity, FileText, ArrowRight, Zap } from 'lucide-react';

export default function LandingPage() {
    const navigate = useNavigate();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-cyan-500/20 blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[120px]" />
            </div>

            {/* Navbar */}
            <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter">
                    <div className="p-2 bg-linear-to-br from-cyan-400 to-blue-600 rounded-lg text-white">
                        <Droplets size={24} />
                    </div>
                    <span className="text-white">AquaSense</span>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/login')} className="px-5 py-2 text-slate-300 hover:text-white font-medium transition-colors">
                        Log In
                    </button>
                    <button onClick={() => navigate('/signup')} className="btn-primary py-2 px-5 text-sm">
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-center max-w-4xl mx-auto"
                >
                    <motion.div variants={itemVariants} className="inline-block mb-4 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-sm font-medium">
                        Next Generation IoT Monitoring
                    </motion.div>

                    <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                        Intelligent <span className="text-gradient">Water Leak Detection</span> & Analytics
                    </motion.h1>

                    <motion.p variants={itemVariants} className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Prevent costly infrastructure damage with real-time monitoring.
                        AquaSense combines advanced sensors with cloud AI to detect leaks instantly.
                    </motion.p>

                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center gap-4">
                        <button onClick={() => navigate('/signup')} className="btn-primary flex items-center justify-center gap-2 text-lg">
                            Start Monitoring <ArrowRight size={20} />
                        </button>
                        <button onClick={() => navigate('/about')} className="btn-secondary text-lg">
                            Meet the Team
                        </button>
                    </motion.div>
                </motion.div>

                {/* Feature Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32"
                >
                    <FeatureCard
                        icon={Zap}
                        title="Real-time Detection"
                        desc="Instant alerts for flow anomalies, pressure drops, and vibration spikes."
                        color="cyan"
                    />
                    <FeatureCard
                        icon={Activity}
                        title="Smart Analytics"
                        desc="Historical data visualization to track usage trends and optimize consumption."
                        color="blue"
                    />
                    <FeatureCard
                        icon={FileText}
                        title="Automated Reports"
                        desc="Generate PDF reports for compliance and auditing with a single click."
                        color="purple"
                    />
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 py-10 mt-20">
                <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 text-sm">
                    &copy; {new Date().getFullYear()} AquaSense Project. Built by Final Year Engineering Team.
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, desc, color }) {
    const colors = {
        cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    };

    return (
        <div className="glass-card p-8 hover:transform hover:-translate-y-2 transition-transform duration-300">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border ${colors[color]}`}>
                <Icon size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-slate-400 leading-relaxed">{desc}</p>
        </div>
    );
}
