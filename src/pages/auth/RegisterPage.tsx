import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, LogIn, UserPlus } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="text-center space-y-2 mb-6 max-w-md w-full">
        <div className="w-14 h-14 rounded-2xl bg-military-600 border border-military-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">SSB MENTOR</h1>
        <p className="text-xs text-slate-400">
          Armed Forces Officer Selection Preparation Platform
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl max-w-md w-full">
        <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 text-xs">
          <Link
            to="/login"
            className="flex-1 py-2 rounded-lg font-bold flex items-center justify-center space-x-1.5 text-slate-400 hover:text-slate-200 transition-all"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
          <div className="flex-1 py-2 rounded-lg font-bold flex items-center justify-center space-x-1.5 bg-military-600 text-white shadow-md">
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white">Create New Cadet Account</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Enter only your email and password (no external verification required). Your preparation progress will be maintained under this email.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-amber-400 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-amber-400 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-military-600 hover:bg-military-500 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg transition-all"
          >
            <span>{loading ? 'Creating Account...' : 'Sign Up & Start Preparation'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-amber-400 hover:underline font-semibold">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
