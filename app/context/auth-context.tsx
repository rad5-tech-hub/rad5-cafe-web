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
  loginAsAdmin: (token: string, userDetails: any) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (adminToken) {
      setUser({
        uid: 'ADMIN000001',
        email: 'admin@rad5cafe.com',
        displayName: 'Café Admin',
        getIdToken: async () => '',
        role: 'admin',
      });
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    localStorage.removeItem('adminToken');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    localStorage.removeItem('adminToken');
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const signOut = async () => {
    localStorage.removeItem('adminToken');
    await firebaseSignOut(auth);
    setUser(null);
  };

  const signInWithGoogle = async () => {
    localStorage.removeItem('adminToken');
    const provider = new GoogleAuthProvider();
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
  };

  const loginAsAdmin = (token: string, userDetails: any) => {
    localStorage.setItem('adminToken', token);
    setUser({
      uid: userDetails.uid || userDetails.id || 'ADMIN000001',
      email: userDetails.email || 'admin@rad5cafe.com',
      displayName: userDetails.fullName || 'Café Admin',
      getIdToken: async () => '',
      role: 'admin',
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, signInWithGoogle, loginAsAdmin }}>
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
