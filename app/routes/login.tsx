import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '~/context/auth-context';
import { useToast } from '~/context/toast-context';
import { AuthBackground } from '~/components/auth-background';
import { Card } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { AnimatedButton } from '~/components/ui/animated-button';

export function meta() {
  return [
    { title: "Login - RAD5 Café" },
    { name: "description", content: "Sign in to your RAD5 Café smart wallet." },
  ];
}

export default function Login() {
  const { signIn, signInWithGoogle, googleRedirectResult, consumeGoogleRedirectResult } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const isAdminLogin = redirect.startsWith('/admin');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const result = consumeGoogleRedirectResult();
    if (result) {
      showToast(result.isNewUser ? "Welcome! Let's setup your PIN." : "Welcome back to RAD5 Café!", 'success');
      navigate(result.isNewUser ? '/setup-pin' : '/');
    }
  }, [googleRedirectResult]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const result = await signInWithGoogle();
      if (result.redirected) {
        return;
      }
      const isNewUser = result.isNewUser;
      showToast(isNewUser ? "Welcome! Let's setup your PIN." : "Welcome back to RAD5 Café!", 'success');
      navigate(isNewUser ? '/setup-pin' : '/dashboard');
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Google Sign-In failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast('Please enter both email and password.', 'warning');
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      showToast('Welcome back, Admin!', 'success');
      navigate(redirect);
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Authentication failed. Please check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 overflow-hidden">
      <AuthBackground />

      <div className="relative z-10 text-center mb-6 select-none animate-fade-in">
        <img src="/RAD5 Cafe.svg" alt="RAD5 Café" className="w-20 h-20 mx-auto mb-3 drop-shadow-lg" />
        <h1
          className="text-5xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-lg"
          style={{ fontFamily: 'var(--font-rounded)' }}
        >
          RAD5 Café
        </h1>
        <p className="text-white/90 text-sm md:text-base mt-1 font-medium tracking-wide drop-shadow-md">
          {isAdminLogin ? 'Staff Console' : 'Wallet & Smart Inventory'}
        </p>
      </div>

      <Card
        padded={true}
        className="relative z-10 w-full max-w-sm flex flex-col gap-5 bg-card border border-border shadow-2xl select-none"
      >
        <div className="flex flex-col gap-1 text-center">
          <h2 className="text-xl font-extrabold text-text-main">
            {isAdminLogin ? 'Staff Access' : 'Sign In'}
          </h2>
          <p className="text-xs text-text-secondary">
            {isAdminLogin ? 'Authenticate with staff credentials' : 'Access your smart wallet'}
          </p>
        </div>

        {isAdminLogin ? (
          <form onSubmit={handleAdminLogin} className="flex flex-col gap-3.5">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. you@rad5cafe.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoCapitalize="none"
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <AnimatedButton
              type="submit"
              variant="secondary"
              size="lg"
              fullWidth={true}
              loading={loading}
              className="font-bold mt-1.5"
            >
              Secure Staff Login
            </AnimatedButton>
          </form>
        ) : (
          <div className="flex flex-col gap-4 py-2">
            <AnimatedButton
              variant="outline"
              size="lg"
              fullWidth={true}
              loading={loading}
              onClick={handleGoogleSignIn}
              className="bg-bg-element hover:bg-bg-selected/35 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 py-3.5 border border-border shadow-xs font-bold cursor-pointer"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="text-text-main font-semibold text-sm">Sign In with Google</span>
            </AnimatedButton>
          </div>
        )}

        <div className="text-xs text-text-secondary pt-3.5 border-t border-border flex flex-col gap-1.5 text-center">
          {isAdminLogin ? (
            <span className="text-[10px] text-text-secondary leading-normal">
              Unauthorized access to staff environment is logged. For assistance, contact support.
            </span>
          ) : (
            <>
              <span>New to RAD5 Café?</span>
              <span className="text-text-secondary">Sign in with Google to continue</span>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
