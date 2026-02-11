'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from '@/lib/firebase-auth';

// Kill switch - set to 'false' in .env.local to disable auth
const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true';

// Allowed emails - comma-separated list in .env.local
// Leave empty or undefined to allow all emails
const ALLOWED_EMAILS = process.env.NEXT_PUBLIC_ALLOWED_EMAILS
  ?.split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean) || [];

function isEmailAllowed(email: string | null): boolean {
  if (!email) return false;
  if (ALLOWED_EMAILS.length === 0) return true; // No restriction if list is empty
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authEnabled: boolean;
  authError: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(AUTH_ENABLED); // Only show loading if auth is enabled
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // If auth is disabled or auth not initialized, skip Firebase auth listener
    if (!AUTH_ENABLED || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if email is allowed
        if (isEmailAllowed(firebaseUser.email)) {
          setUser(firebaseUser);
          setAuthError(null);
        } else {
          // Email not allowed - sign them out
          if (auth) await firebaseSignOut(auth);
          setUser(null);
          setAuthError(`Access denied. ${firebaseUser.email} is not authorized.`);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    if (!AUTH_ENABLED || !auth) return;

    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // Email check happens in onAuthStateChanged
      if (!isEmailAllowed(result.user.email)) {
        // Will be signed out by the listener, but set error immediately for UX
        setAuthError(`Access denied. ${result.user.email} is not authorized.`);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    if (!AUTH_ENABLED || !auth) return;

    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    authEnabled: AUTH_ENABLED,
    authError,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
