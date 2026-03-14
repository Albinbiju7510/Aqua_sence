
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import LandingPage from './pages/LandingPage';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';

// Protected Route Wrapper
function PrivateRoute({ children }) {
    const { currentUser, loading } = useAuth();
    if (loading) return null; // Or a loader
    return currentUser ? children : <Navigate to="/login" />;
}

// Admin Route Wrapper
function AdminRoute({ children }) {
    const { currentUser, userRole, loading } = useAuth();
    if (loading) return null;
    return (currentUser && currentUser.email === 'albinbiju75100@gmail.com') ? children : <Navigate to="/dashboard" />;
}

// Layout for authenticated pages
function Layout({ children }) {
    return (
        <div className="flex min-h-screen font-sans text-slate-100">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto ml-0 md:ml-64">
                {children}
            </main>

            {/* Mobile Navigation */}
            <MobileNav />
        </div>
    );
}

function App() {
    console.log("📱 App component rendering");
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

                    {/* Protected Routes */}
                    <Route path="/dashboard" element={
                        <Layout>
                            <Dashboard />
                        </Layout>
                    } />

                    <Route path="/about" element={
                        <PrivateRoute>
                            <Layout>
                                <About />
                            </Layout>
                        </PrivateRoute>
                    } />

                    <Route path="/settings" element={
                        <PrivateRoute>
                            <Layout>
                                <Settings />
                            </Layout>
                        </PrivateRoute>
                    } />

                    <Route path="/admin" element={
                        <AdminRoute>
                            <Layout>
                                <AdminDashboard />
                            </Layout>
                        </AdminRoute>
                    } />

                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
