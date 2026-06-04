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

type AuthContextType = {
  user: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<boolean>;
  googleRedirectResult: { isNewUser: boolean } | null;
  consumeGoogleRedirectResult: () => { isNewUser: boolean } | null;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
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

  const signInWithGoogle = async () => {
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
      return isNewUser;
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, provider);
        return false;
      }
      throw error;
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
