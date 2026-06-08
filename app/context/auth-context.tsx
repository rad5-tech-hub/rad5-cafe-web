import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';
import {
  type User,
  getAdditionalUserInfo,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';

import { auth } from '~/lib/firebase';
import { api } from '~/lib/api';
import { useToast } from '~/context/toast-context';

export type GoogleSignInResult = {
  redirected: boolean;
  isNewUser?: boolean;
};

export function getFriendlyAuthErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred.';
  const code = error.code || error.message || '';
  
  if (code.includes('auth/popup-blocked')) {
    return 'The sign-in pop-up was blocked by your browser. Redirecting you to complete sign-in...';
  }
  if (code.includes('auth/popup-closed-by-user')) {
    return 'The sign-in window was closed before finishing. Please try again.';
  }
  if (code.includes('auth/cancelled-popup-request')) {
    return 'Sign-in request was cancelled. Please try again.';
  }
  if (code.includes('auth/network-request-failed')) {
    return 'Network connection error. Please check your internet connection and try again.';
  }
  if (code.includes('auth/account-exists-with-different-credential')) {
    return 'An account already exists with this email address but using a different sign-in method.';
  }
  if (code.includes('auth/operation-not-allowed')) {
    return 'Google Sign-In is not enabled for this platform. Please contact administrator.';
  }
  if (code.includes('auth/user-disabled')) {
    return 'Your account has been disabled. Please contact support.';
  }
  if (code.includes('auth/internal-error')) {
    return 'An internal error occurred. Please try again later.';
  }
  if (code.includes('auth/invalid-credential')) {
    return 'Invalid sign-in credentials. Please try again.';
  }

  return error.message || 'Google Sign-In failed. Please try again.';
}

type AuthContextType = {
  user: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<GoogleSignInResult>;
  googleRedirectResult: { isNewUser: boolean } | null;
  consumeGoogleRedirectResult: () => { isNewUser: boolean } | null;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [googleRedirectResult, setGoogleRedirectResult] = useState<{ isNewUser: boolean } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result) {
        const isNewUser = getAdditionalUserInfo(result)?.isNewUser ?? false;
        if (isNewUser) {
          api.auth.updateProfile({
            fullName: result.user.displayName || '',
            phoneNumber: result.user.phoneNumber || '',
          }).catch((err) => {
            console.warn('Backend profile update failed:', err);
          });
        }
        setGoogleRedirectResult({ isNewUser });
      }
    }).catch((err) => {
      console.warn('Redirect sign-in error:', err);
      showToast(getFriendlyAuthErrorMessage(err), 'error');
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  const signInWithGoogle = async (): Promise<GoogleSignInResult> => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const isNewUser = getAdditionalUserInfo(result)?.isNewUser ?? false;
      if (isNewUser) {
        try {
          await api.auth.updateProfile({
            fullName: result.user.displayName || '',
            phoneNumber: result.user.phoneNumber || '',
          });
        } catch (err) {
          console.warn('Backend profile update failed:', err);
        }
      }
      return { redirected: false, isNewUser };
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked') {
        showToast('The Google Sign-In pop-up was blocked. Redirecting you to complete sign-in...', 'info');
        await signInWithRedirect(auth, provider);
        return { redirected: true };
      }
      
      const friendlyMessage = getFriendlyAuthErrorMessage(error);
      const friendlyError = new Error(friendlyMessage);
      (friendlyError as any).code = error.code;
      throw friendlyError;
    }
  };

  const consumeGoogleRedirectResult = () => {
    const result = googleRedirectResult;
    if (result) {
      setGoogleRedirectResult(null);
    }
    return result;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, signInWithGoogle, googleRedirectResult, consumeGoogleRedirectResult }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
