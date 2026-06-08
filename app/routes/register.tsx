import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '~/context/auth-context';
import { useToast } from '~/context/toast-context';
import { AuthBackground } from '~/components/auth-background';
import { Card } from '~/components/ui/card';
import { AnimatedButton } from '~/components/ui/animated-button';

export function meta() {
  return [
    { title: "Register - RAD5 Café" },
    { name: "description", content: "Create an account for the RAD5 Café smart wallet." },
  ];
}

export default function Register() {
  const { signInWithGoogle, googleRedirectResult, consumeGoogleRedirectResult } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const result = consumeGoogleRedirectResult();
    if (result) {
      if (result.isNewUser) {
        showToast('Account created successfully! Now set up your security PIN.', 'success');
        navigate('/setup-pin');
      } else {
        showToast('Welcome back! You already have an account.', 'success');
        navigate('/dashboard');
      }
    }
  }, [googleRedirectResult]);

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      const result = await signInWithGoogle();
      if (result.redirected) {
        return;
      }
      const isNewUser = result.isNewUser;
      if (isNewUser) {
        showToast('Account created successfully! Now set up your security PIN.', 'success');
        navigate('/setup-pin');
      } else {
        showToast('Welcome back! You already have an account.', 'success');
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Slideshow background */}
      <AuthBackground />

      {/* Action Card */}
      <Card
        padded={true}
        className="relative z-10 w-full max-w-sm flex flex-col gap-6 bg-card border border-border shadow-2xl select-none"
      >
        <div className="text-center flex flex-col gap-1.5">
          <h1
            className="text-2xl font-bold text-text-main tracking-tight"
            style={{ fontFamily: 'var(--font-rounded)' }}
          >
            Create Account
          </h1>
          <p className="text-text-secondary text-xs">
            Join the RAD5 Café smart wallet ecosystem
          </p>
        </div>

        <div className="flex flex-col gap-4 py-2">
          <AnimatedButton
            variant="outline"
            size="lg"
            fullWidth={true}
            loading={loading}
            onClick={handleGoogleSignUp}
            className="bg-bg-element hover:bg-bg-selected/35 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 py-3.5 border border-border shadow-xs font-bold text-text-main cursor-pointer"
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
            <span className="font-semibold text-sm">Sign Up with Google</span>
          </AnimatedButton>
        </div>

        <div className="text-xs text-center text-text-secondary border-t border-border pt-4 flex items-center justify-center gap-1.5 font-semibold font-rounded">
          <span>Already have an account?</span>
          <Link to="/login" className="text-tint underline hover:text-tint-dark">
            Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
}
