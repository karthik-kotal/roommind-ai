import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogIn, UserPlus, LogOut, User as UserIcon, Camera, Sparkles } from 'lucide-react';

interface NavbarProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenScanner?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onOpenScanner }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <nav className="glass-nav sticky top-0 z-40 w-full px-4 sm:px-8 py-3 flex items-center justify-between border-b border-white/10 backdrop-blur-md bg-slate-950/80">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            ROOMMIND<span className="text-indigo-400">.AI</span>
          </span>
          <span className="block text-[10px] text-slate-400 font-medium tracking-widest uppercase">
            Spatial Redesign Studio
          </span>
        </div>
      </div>

      {/* Action CTA & Auth Buttons */}
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            {onOpenScanner && (
              <button
                onClick={onOpenScanner}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>Scan Room</span>
              </button>
            )}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 transition"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-600/50 flex items-center justify-center text-xs font-bold text-indigo-200">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden md:inline text-sm font-medium">{user?.fullName || user?.email}</span>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-fadeIn">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-sm font-semibold text-white">{user?.fullName}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg transition mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAuth('login')}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition border border-white/10"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition shadow-md shadow-indigo-600/30"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
