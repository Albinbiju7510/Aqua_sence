import { useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Droplets, User, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
    const emailRef = useRef();
    const passwordRef = useRef();
    const { login } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            await login(emailRef.current.value, passwordRef.current.value);
            navigate('/dashboard');
        } catch (err) {
            console.error("Login Error Details:", err);
            let message = 'Failed to log in.';

            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-email') {
                message = 'Invalid email or password. Please check your credentials.';
            } else if (err.code === 'auth/too-many-requests') {
                message = 'Too many failed attempts. Try again later or reset your password.';
            } else if (err.code === 'auth/network-request-failed') {
                message = 'Network error. Please check your internet connection.';
            } else if (err.code === 'auth/operation-not-allowed') {
                message = 'Email/Password login is not enabled in your Firebase Console.';
            } else if (err.code === 'auth/internal-error') {
                message = 'A system error occurred. Please try again or check your Firebase configuration.';
            } else if (err.message) {
                message = err.message;
            }
            setError(message);
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-dark p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="max-w-md w-full"
            >
                <div className="blynk-card border border-[#333] p-8 md:p-10">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-4 bg-primary rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(46,204,113,0.3)]">
                            <Droplets size={32} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                        <p className="text-text-muted">Access your AquaSense Dashboard</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-start gap-3 text-danger text-sm">
                            <div className="mt-0.5"><Lock size={16} /></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="relative group">
                            <User className="absolute left-4 top-3.5 text-text-muted group-focus-within:text-primary transition-colors" size={20} />
                            <input
                                type="email"
                                ref={emailRef}
                                required
                                className="input-field pl-12"
                                placeholder="Email Address"
                            />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 text-text-muted group-focus-within:text-primary transition-colors" size={20} />
                            <input
                                type="password"
                                ref={passwordRef}
                                required
                                className="input-field pl-12"
                                placeholder="Password"
                            />
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <>Log In <ArrowRight size={20} /></>}
                        </button>
                    </form>

                    <div className="text-center mt-8 text-text-muted text-sm">
                        Don&apos;t have an account? <Link to="/signup" className="text-primary hover:text-[#27ae60] font-medium hover:underline">Sign Up</Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
