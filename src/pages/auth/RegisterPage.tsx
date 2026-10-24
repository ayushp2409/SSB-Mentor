import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, Mail, User, ArrowRight, AlertCircle, Target } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [targetEntry, setTargetEntry] = useState('CDS');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register(email, password, displayName, targetEntry);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-military-600 text-amber-400 flex items-center justify-center mx-auto shadow-md">
          <Shield className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-white">Cadet Enrolment</h1>
        <p className="text-xs text-slate-400">Join the disciplined SSB preparation community</p>
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                placeholder="Candidate Full Name"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Armed Forces Entry</label>
            <div className="relative">
              <Target className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <select
                value={targetEntry}
                onChange={(e) => setTargetEntry(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-hidden focus:border-amber-400 font-medium"
              >
                <option value="NDA">NDA (National Defence Academy)</option>
                <option value="CDS">CDS (IMA / OTA / INA / AFA)</option>
                <option value="AFCAT">AFCAT (Air Force Common Admission Test)</option>
                <option value="TGC">TGC / SSC-Tech (Engineering Direct Entry)</option>
                <option value="INET">INET (Indian Navy Entrance Test)</option>
                <option value="NCC">NCC Special Entry Scheme</option>
                <option value="JAG">JAG (Judge Advocate General)</option>
              </select>
            </div>
          </div>

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
                placeholder="your.email@example.com"
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
                placeholder="Minimum 6 characters"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-military-600 hover:bg-military-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg transition-transform"
          >
            <span>{loading ? 'Registering...' : 'Create Cadet Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-amber-400 hover:underline font-semibold">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};
