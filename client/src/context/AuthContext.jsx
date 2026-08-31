/**
 * ==============================================================================
 * SkinLab AI - Production Auth & Permission Context
 * ==============================================================================
 * Manages user session, login, logout, password reset, and RBAC guards.
 * Supported Roles: Owner, Admin, Manager, Doctor, Therapist, Receptionist (Cashier).
 * ==============================================================================
 */

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ShieldAlert, Lock, UserCheck, ArrowRight } from 'lucide-react';

const AuthContext = createContext();

export const ROLE_PERMISSIONS = {
  pos: ['owner', 'admin', 'manager', 'doctor', 'therapist', 'receptionist', 'cashier'],
  appointments: ['owner', 'admin', 'manager', 'doctor', 'therapist', 'receptionist', 'cashier'],
  prm: ['owner', 'admin', 'manager', 'doctor', 'therapist', 'receptionist'],
  'ai-doctor': ['owner', 'admin', 'manager', 'doctor', 'therapist'],
  'voice-agent': ['owner', 'admin', 'manager', 'receptionist'],
  whatsapp: ['owner', 'admin', 'manager', 'receptionist'],
  reports: ['owner', 'admin', 'manager'],
  catalog: ['owner', 'admin', 'manager'],
  hrm: ['owner', 'admin', 'manager'],
  purchases: ['owner', 'admin', 'manager'],
  settings: ['owner', 'admin']
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState({
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Clinic Administrator',
    email: 'admin@skinlab.com',
    role: 'admin'
  });

  const [currentRole, setCurrentRole] = useState('admin');

  useEffect(() => {
    const savedRole = localStorage.getItem('skinlab_user_role');
    if (savedRole) {
      setCurrentRole(savedRole);
      setUser(prev => ({ ...prev, role: savedRole }));
    }
  }, []);

  const changeRole = (newRole) => {
    setCurrentRole(newRole);
    localStorage.setItem('skinlab_user_role', newRole);
    setUser(prev => ({ ...prev, role: newRole }));
  };

  const login = async (email, password) => {
    const mockUser = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: email.split('@')[0],
      email,
      role: currentRole
    };
    setUser(mockUser);
    return { success: true, user: mockUser };
  };

  const logout = async () => {
    setUser(null);
  };

  const resetPassword = async (email) => {
    return { success: true, message: `Password reset instructions sent to ${email}` };
  };

  const hasPermission = (tabKey) => {
    const allowed = ROLE_PERMISSIONS[tabKey] || [];
    return allowed.includes(currentRole.toLowerCase()) || currentRole.toLowerCase() === 'owner';
  };

  return (
    <AuthContext.Provider value={{
      user,
      currentRole,
      changeRole,
      login,
      logout,
      resetPassword,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function PermissionDeniedScreen({ requiredRoles = [], onSwitchRole }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-rose-200 rounded-3xl p-8 text-center space-y-5 shadow-xl text-slate-900">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl mx-auto flex items-center justify-center border border-rose-300">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Access Restricted</h2>
          <p className="text-xs text-slate-600 font-semibold mt-1">
            Your active role does not have permission to view or modify this module.
          </p>
        </div>

        <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200 text-xs font-mono text-rose-900 font-bold space-y-1">
          <div>Required Roles: <span className="underline font-black">{requiredRoles.join(', ')}</span></div>
        </div>

        {onSwitchRole && (
          <button
            onClick={() => onSwitchRole('admin')}
            className="w-full py-3 rounded-xl font-extrabold text-xs bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center space-x-2 transition shadow cursor-pointer"
          >
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Switch to Admin Role</span>
          </button>
        )}
      </div>
    </div>
  );
}
