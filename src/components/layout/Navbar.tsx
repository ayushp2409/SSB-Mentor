import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  LayoutDashboard,
  BrainCircuit,
  Mic,
  Users2,
  FileQuestion,
  BookMarked,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  UserCheck
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAdmin, logout, switchDemoRole } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Psychology', path: '/psychology', icon: BrainCircuit },
    { label: 'Lecturette', path: '/lecturette', icon: Mic },
    { label: 'GTO Tasks', path: '/gto', icon: Users2 },
    { label: 'Interview', path: '/interview', icon: FileQuestion },
    { label: 'SDT & Journal', path: '/journal', icon: BookMarked },
    { label: 'Progress', path: '/progress', icon: TrendingUp },
  ];

  if (isAdmin) {
    navLinks.push({ label: 'Admin Console', path: '/admin', icon: Settings });
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg bg-military-600 flex items-center justify-center text-white shadow-sm group-hover:bg-military-500 transition-colors">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-lg tracking-wide text-white">SSB MENTOR</span>
                <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-mono font-semibold uppercase">
                  Cadet Prep
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight">Services Selection Board Platform</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'bg-military-700/80 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action / Role Quick-Switch */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* Quick Demo Role Switcher */}
            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => switchDemoRole('student')}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  !isAdmin ? 'bg-military-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Switch view to Student Candidate"
              >
                Cadet
              </button>
              <button
                type="button"
                onClick={() => switchDemoRole('admin')}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  isAdmin ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Switch view to Administrator / Assessor"
              >
                Assessor / Admin
              </button>
            </div>

            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-700">
                <div className="text-right">
                  <div className="text-xs font-semibold text-white leading-tight">{user.displayName}</div>
                  <div className="text-[10px] text-amber-400 font-mono uppercase">{user.role}</div>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-military-600 hover:bg-military-500 text-white transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                <span>Cadet Login</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-hidden"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                  active ? 'bg-military-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-slate-400">Mode:</span>
              <button
                onClick={() => { switchDemoRole('student'); setMobileMenuOpen(false); }}
                className={`px-2 py-1 rounded ${!isAdmin ? 'bg-military-600 text-white' : 'text-slate-400'}`}
              >
                Cadet
              </button>
              <button
                onClick={() => { switchDemoRole('admin'); setMobileMenuOpen(false); }}
                className={`px-2 py-1 rounded ${isAdmin ? 'bg-amber-600 text-white' : 'text-slate-400'}`}
              >
                Admin
              </button>
            </div>
            {user && (
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="text-xs text-rose-400 hover:underline flex items-center space-x-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
