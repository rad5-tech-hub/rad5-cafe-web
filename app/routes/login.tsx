import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '~/context/auth-context';
import { useToast } from '~/context/toast-context';
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
  const [authError, setAuthError] = useState('');

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
      setAuthError('');
      const result = await signInWithGoogle();
      if (result.redirected) return;
      const isNewUser = result.isNewUser;
      showToast(isNewUser ? "Welcome! Let's setup your PIN." : "Welcome back to RAD5 Café!", 'success');
      navigate(isNewUser ? '/setup-pin' : '/dashboard');
    } catch (error: any) {
      console.error(error);
      const message = error.message || 'Google Sign-In failed. Please try again.';
      setAuthError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!email.trim() || !password.trim()) {
      setAuthError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      showToast('Welcome back, Admin!', 'success');
      navigate(redirect);
    } catch (error: any) {
      console.error(error);
      const message = error.message || 'Authentication failed. Please check your credentials.';
      setAuthError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-5 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-44 -left-28 w-[620px] h-[620px] rounded-full" style={{ background: 'radial-gradient(circle at 30% 30%, var(--tint-c), rgba(0,61,153,0) 70%)' }} />
        <div className="absolute top-28 -right-40 w-[560px] h-[560px] rounded-full" style={{ background: 'radial-gradient(circle at 60% 40%, rgba(59,130,246,0.22), rgba(59,130,246,0) 70%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-[420px] p-7 sm:p-8 rounded-[22px] glass-surface rad5-pop">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-tint" />
          <span className="font-extrabold text-base tracking-tight">RAD5 Café</span>
        </div>

        <h2 className="mt-5 mb-1.5 text-2xl font-extrabold tracking-tight">
          {isAdminLogin ? 'Staff Access' : 'Welcome back'}
        </h2>
        <p className="text-sm text-text-secondary">
          {isAdminLogin ? 'Authenticate with staff credentials.' : 'Sign in to order and pay from your wallet.'}
        </p>

        {isAdminLogin ? (
          <form onSubmit={handleAdminLogin} className="mt-6 flex flex-col gap-3.5">
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
            {authError && <div className="text-xs font-semibold text-error-val">{authError}</div>}
            <AnimatedButton type="submit" variant="primary" size="lg" fullWidth loading={loading} className="mt-1.5 font-bold">
              Secure Staff Login
            </AnimatedButton>
          </form>
        ) : (
          <div className="mt-6">
            <AnimatedButton
              variant="outline"
              size="lg"
              fullWidth
              loading={loading}
              onClick={handleGoogleSignIn}
              className="bg-card hover:bg-bg-selected/40 flex items-center justify-center gap-3 py-3.5 border border-border shadow-xs font-bold cursor-pointer"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="text-text-main font-semibold text-sm">Continue with Google</span>
            </AnimatedButton>
            {authError && <div className="mt-3 text-xs font-semibold text-error-val">{authError}</div>}
          </div>
        )}

        <div className="mt-5 text-center text-[13.5px] text-text-secondary">
          {isAdminLogin ? (
            <span className="text-[11px] leading-normal">
              Unauthorized access to staff environment is logged. For assistance, contact support.
            </span>
          ) : (
            <>
              New to RAD5 Café?{' '}
              <Link to="/register" className="text-tint font-bold hover:text-tint-dark">
                Create an account
              </Link>
            </>
          )}
        </div>
        <div className="mt-2 text-center text-[13px]">
          <Link to="/" className="text-text-secondary hover:text-text-main">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
