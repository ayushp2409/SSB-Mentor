import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('cadet@ssbmentor.in');
  const [password, setPassword] = useState('Cadet@123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: 'student' | 'admin') => {
    switchDemoRole(role);
    navigate('/');
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-military-600 text-amber-400 flex items-center justify-center mx-auto shadow-md">
          <Shield className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-white">Cadet Portal Login</h1>
        <p className="text-xs text-slate-400">Sign in to resume your daily SSB preparation regimen</p>
      </div>

      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
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
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                placeholder="cadet@ssbmentor.in"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-military-600 hover:bg-military-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg transition-transform"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Logins for instant evaluation */}
        <div className="pt-4 border-t border-slate-700/80 space-y-2">
          <div className="text-[11px] text-center font-semibold text-slate-400">Instant Demo Evaluation Access:</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('student')}
              className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              Log in as Student
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-amber-400 transition-colors"
            >
              Log in as Admin
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400">
          New cadet?{' '}
          <Link to="/register" className="text-amber-400 hover:underline font-semibold">
            Register new account
          </Link>
        </div>
      </div>
    </div>
  );
};
