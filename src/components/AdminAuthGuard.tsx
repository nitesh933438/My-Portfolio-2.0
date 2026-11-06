import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, isUserAdmin } from '../services/academicFirebase';
import { LoadingScreen } from './LoadingScreen';
import { Lock } from 'lucide-react';

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
  if (!user || !isUserAdmin(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center p-8">
          <Lock className="w-12 h-12 mx-auto text-rose-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-slate-400">You do not have administrative access.</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};
