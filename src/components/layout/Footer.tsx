import React from 'react';
import { Shield, BookOpen, AlertTriangle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-white text-sm tracking-wider">SSB MENTOR</span>
            <span className="text-slate-500">| Complete Officer Preparation System</span>
          </div>
          <div className="flex items-center space-x-6 text-slate-400">
            <span>Stage I Screening</span>
            <span>Stage II Psychology</span>
            <span>GTO Tasks</span>
            <span>Personal Interview</span>
            <span>Conference</span>
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-lg p-3 text-[11px] text-slate-400 border border-slate-700/50 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            <strong>Standard Disclaimer:</strong> SSB Mentor is an independent self-preparation and practice platform designed to cultivate Officer Like Qualities (OLQs) and structured thinking. The platform does not guarantee recommendation, predict selection board results, or claim official endorsement by the Ministry of Defence, DIPR, or the Services Selection Board.
          </p>
        </div>

        <div className="text-center text-[11px] text-slate-500">
          &copy; {new Date().getFullYear()} SSB Mentor Platform. Dedicated to the aspirants of the Indian Armed Forces.
        </div>
      </div>
    </footer>
  );
};
