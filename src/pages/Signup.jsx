import { useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore'; // Firestore functions
import { deleteUser } from 'firebase/auth';
import { Droplets, User, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Signup() {
    const nameRef = useRef();
    const emailRef = useRef();
    const passwordRef = useRef();
    const passwordConfirmRef = useRef();

    const { signup } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(''); // Added to track progress
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        if (passwordRef.current.value !== passwordConfirmRef.current.value) {
            return setError('Passwords do not match');
        }

        try {
            setError('');
            setLoading(true);
            setStatus('Creating account...');

            // 1. Create Auth User
            const userCredential = await signup(emailRef.current.value, passwordRef.current.value);
            const user = userCredential.user;
            setStatus('Setting up profile...');

            try {
                // 2. Create User Profile in Firestore
                const profileData = {
                    name: nameRef.current.value,
                    email: emailRef.current.value,
                    role: emailRef.current.value === 'albinbiju75100@gmail.com' ? "admin" : "user",
                    status: "active",
                    createdAt: new Date().toISOString(),
                    blynkToken: "" // Initialize with empty token
                };

                // Create a timeout promise for Firestore
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Database connection timed out. Please check your internet or retry.")), 10000)
                );

                // Race the Firestore write against the timeout
                await Promise.race([
                    setDoc(doc(db, "users", user.uid), profileData, { merge: true }),
                    timeoutPromise
                ]);

                navigate("/dashboard");
            } catch (firestoreError) {
                console.error("Firestore Error:", firestoreError);

                // Rollback: Delete the user from Auth if Firestore write fails
                try {
                    await deleteUser(user);
                } catch (deleteError) {
                    console.error("Failed to rollback auth user:", deleteError);
                }
                throw new Error("Failed to initialize user session. Please try again.");
            }
        } catch (err) {
            console.error("Signup Error Details:", err);

            let message = 'Failed to create an account.';
            if (err.code === 'auth/email-already-in-use') {
                message = 'This email is already registered. Try logging in.';
            } else if (err.code === 'auth/weak-password') {
                message = 'Password is too weak. Please use at least 6 characters.';
            } else if (err.code === 'auth/operation-not-allowed') {
                message = 'Email/Password sign-in is not enabled in your Firebase Console.';
            } else if (err.code === 'auth/invalid-email') {
                message = 'The email address is badly formatted.';
            } else if (err.code === 'auth/internal-error') {
                message = 'A system error occurred. Please check your Firebase configuration.';
            } else if (err.message) {
                // Show the specific error message from Firebase
                message = `${err.message} (${err.code || 'unknown_error'})`;
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
                        <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
                        <p className="text-text-muted">Join the AquaSense network</p>
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
                                type="text"
                                ref={nameRef}
                                required
                                className="input-field pl-12"
                                placeholder="Full Name"
                            />
                        </div>

                        <div className="relative group">
                            <Mail className="absolute left-4 top-3.5 text-text-muted group-focus-within:text-primary transition-colors" size={20} />
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

                        <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 text-text-muted group-focus-within:text-primary transition-colors" size={20} />
                            <input
                                type="password"
                                ref={passwordConfirmRef}
                                required
                                className="input-field pl-12"
                                placeholder="Confirm Password"
                            />
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="btn-primary w-full flex flex-col items-center justify-center gap-1 mt-2 py-3"
                        >
                            {loading ? (
                                <>
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>Processing...</span>
                                    </div>
                                    <span className="text-[10px] opacity-70 font-normal uppercase tracking-widest">{status}</span>
                                </>
                            ) : (
                                <div className="flex items-center gap-2">
                                    Sign Up <ArrowRight size={20} />
                                </div>
                            )}
                        </button>
                    </form>

                    <div className="text-center mt-8 text-text-muted text-sm">
                        Already have an account? <Link to="/login" className="text-primary hover:text-[#27ae60] font-medium hover:underline">Log In</Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
