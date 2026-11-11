import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { auth, isUserAdmin, googleProvider } from '../services/academicFirebase';
import { LoadingScreen } from './LoadingScreen';
import { Lock, LogOut, AlertCircle, Loader2 } from 'lucide-react';
import { GoogleIcon } from './GoogleIcon';

export const AdminAuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Handle redirect result if redirect login was used as fallback
    getRedirectResult(auth).catch((err) => {
      console.warn('Redirect result error:', err);
    });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      setSigningIn(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async (useRedirect = false) => {
    if (signingIn) return;
    setSigningIn(true);
    setErrorMsg(null);

    try {
      if (useRedirect) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setSigningIn(false);

      const code = err.code || '';
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        setErrorMsg('Popup was blocked or is not supported in this preview frame. Click below to sign in with redirect.');
      } else if (code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in popup was closed before completing. Please try again.');
      } else if (code === 'auth/unauthorized-domain') {
        setErrorMsg('This domain is not authorized in Firebase Authentication settings.');
      } else if (code === 'auth/network-request-failed') {
        setErrorMsg('Network error during sign-in. Please check your internet connection.');
      } else {
        setErrorMsg(err.message || 'Failed to authenticate with Google. Please try again.');
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setErrorMsg(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  if (loading) return <LoadingScreen />;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 transition-colors">
        <div className="max-w-md w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-cyan-400">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">Admin Console</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Sign in with the authorized administrator Google account to manage the portfolio.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            <button 
              onClick={() => handleGoogleLogin(false)}
              disabled={signingIn}
              className="w-full group flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-900 dark:text-white px-6 py-3.5 rounded-2xl font-bold text-sm shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {signingIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <GoogleIcon className="w-5 h-5" />
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            {errorMsg?.includes('redirect') && (
              <button
                onClick={() => handleGoogleLogin(true)}
                disabled={signingIn}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all"
              >
                Sign In with Redirect (Fallback)
              </button>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <a href="#/" className="text-xs font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-cyan-400">
              ← Return to Public Portfolio
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!isUserAdmin(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 transition-colors">
        <div className="max-w-md w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">Access Denied</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Signed in as <strong className="text-slate-800 dark:text-slate-200">{user.email}</strong>. This account is not authorized for administrative access.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSignOut}
              className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Sign Out</span>
            </button>
            <a
              href="#/"
              className="flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center justify-center"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
