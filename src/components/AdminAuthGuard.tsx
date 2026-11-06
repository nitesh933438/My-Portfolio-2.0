import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup } from 'firebase/auth';
import { auth, isUserAdmin, googleProvider } from '../services/academicFirebase';
import { LoadingScreen } from './LoadingScreen';
import { Lock } from 'lucide-react';
import { GoogleIcon } from './GoogleIcon';

export const AdminAuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <LoadingScreen />;
  if (loading) return <LoadingScreen />;
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center p-8">
          <Lock className="w-12 h-12 mx-auto text-indigo-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Admin Login</h2>
          <p className="text-slate-400 mb-6">Please sign in to access the admin console.</p>
          <button 
            onClick={() => signInWithPopup(auth, googleProvider)}
            className="group flex items-center gap-3 bg-white dark:bg-white text-slate-900 px-6 py-3 rounded-xl font-bold shadow-md hover:bg-slate-50 transition-all active:scale-95"
          >
            <GoogleIcon className="w-5 h-5" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (!isUserAdmin(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center p-8">
          <Lock className="w-12 h-12 mx-auto text-rose-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-slate-400">Your account is not authorized for administrative access.</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};
