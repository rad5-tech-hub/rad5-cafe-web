import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '~/context/auth-context';
import { useToast } from '~/context/toast-context';

const APK_URL = 'https://firebasestorage.googleapis.com/v0/b/shield-3f2ba.firebasestorage.app/o/apps%2Fcafe1.1.apk?alt=media&token=d15ab3e4-a65c-47ec-b40c-2da3adb55272';

const IMAGES = [
  'https://images.pexels.com/photos/34932768/pexels-photo-34932768.jpeg',
  'https://images.pexels.com/photos/29445730/pexels-photo-29445730.jpeg',
  'https://images.pexels.com/photos/10885488/pexels-photo-10885488.jpeg',
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&auto=format&fit=crop',
];

export function meta() {
  return [
    { title: 'RAD5 Café — Smart Wallet & Instant Ordering' },
    { name: 'description', content: 'Download the Android app or sign in with Google to order fresh meals, pastries, and coffee. Smart wallet, secure PIN checkout, and real-time inventory tracking.' },
    { name: 'keywords', content: 'RAD5 Café, smart wallet, food ordering, café, coffee, pastries, Nigerian food, Android app, Google sign-in' },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: 'RAD5 Café — Smart Wallet & Instant Ordering' },
    { property: 'og:description', content: 'Download the Android app or sign in with Google. Fresh meals, secure PIN checkout, real-time inventory.' },
    { property: 'og:url', content: 'https://rad5cafe.vercel.app' },
    { property: 'og:image', content: 'https://images.pexels.com/photos/34932768/pexels-photo-34932768.jpeg' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'RAD5 Café — Smart Wallet & Instant Ordering' },
    { name: 'twitter:description', content: 'Download the Android app or sign in with Google. Fresh meals, secure PIN checkout, real-time inventory.' },
    { name: 'twitter:image', content: 'https://images.pexels.com/photos/34932768/pexels-photo-34932768.jpeg' },
  ];
}

export default function Landing() {
  const { signInWithGoogle, googleRedirectResult, consumeGoogleRedirectResult } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [activeIdx, setActiveIdx] = useState(0);
  const [loggingIn, setLoggingIn] = useState(false);
  const [showApkPopup, setShowApkPopup] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setActiveIdx(i => (i + 1) % IMAGES.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const result = consumeGoogleRedirectResult();
    if (result) {
      showToast(result.isNewUser ? "Welcome! Let's setup your PIN." : 'Welcome back!', 'success');
      navigate(result.isNewUser ? '/setup-pin' : '/dashboard');
    }
  }, [googleRedirectResult]);

  const handleGoogleSignIn = async () => {
    try {
      setLoggingIn(true);
      const isNewUser = await signInWithGoogle();
      showToast(isNewUser ? "Welcome! Let's setup your PIN." : 'Welcome back!', 'success');
      navigate(isNewUser ? '/setup-pin' : '/dashboard');
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Sign-in failed. Try again.', 'error');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 overflow-hidden bg-black">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'RAD5 Café',
            applicationCategory: 'FoodApplication',
            operatingSystem: 'Android',
            description: 'Smart wallet and instant ordering for RAD5 Café. Secure PIN checkout and real-time inventory.',
            url: 'https://rad5cafe.vercel.app',
            downloadUrl: APK_URL,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'NGN' },
            provider: { '@type': 'Organization', name: 'RAD5 Tech Hub' },
          }),
        }}
      />

      {/* Image Carousel */}
      <div className="absolute inset-0">
        {IMAGES.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
            style={{
              backgroundImage: `url(${src})`,
              opacity: i === activeIdx ? 1 : 0,
            }}
          />
        ))}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center w-full max-w-sm flex flex-col items-center gap-6">
        <img
          src="/RAD5 Cafe.svg"
          alt="RAD5 Café"
          className="w-24 h-24 drop-shadow-xl"
        />

        <div className="flex flex-col gap-1">
          <h1
            className="text-5xl font-extrabold text-white tracking-tight drop-shadow-lg"
            style={{ fontFamily: 'var(--font-rounded)' }}
          >
            RAD5 Café
          </h1>
          <p className="text-white/70 text-sm font-medium tracking-wide">
            Smart Wallet & Ordering
          </p>
        </div>

        <div className="flex flex-col w-full gap-3">
          <button
            onClick={() => setShowApkPopup(true)}
            className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white text-[#003D99] font-bold text-sm hover:bg-gray-100 transition-all shadow-2xl shadow-black/30 cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.523 2.264a1.5 1.5 0 0 1 .212 2.112l-5.205 6.868a.754.754 0 0 1-1.048.11.77.77 0 0 1-.11-1.049l5.205-6.868a1.5 1.5 0 0 1 2.112-.212l.834.607ZM6.83 3.166a2.25 2.25 0 0 0-.83 1.792v14.084a2.25 2.25 0 0 0 .83 1.792l.045.035 7.686-7.686a1.126 1.126 0 0 0 0-1.592L6.875 3.134l-.046.035Z"/>
              <path d="m18.566 12.4-4.758 4.758L7.14 10.5a.756.756 0 0 1-.044-1.068.756.756 0 0 1 1.002-.045l11.416 6.66.834.607a1.5 1.5 0 0 0 .213-2.111l-.213-.213-1.782-1.782Z"/>
            </svg>
            Download Android App
          </button>

          <button
            onClick={handleGoogleSignIn}
            disabled={loggingIn}
            className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-[#003D99]/90 hover:bg-[#003D99] text-white font-bold text-sm backdrop-blur-sm transition-all shadow-2xl shadow-[#003D99]/30 disabled:opacity-60"
          >
            {loggingIn ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            Continue with Google
          </button>
        </div>
      </div>

      {/* APK Popup */}
      {showApkPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={() => setShowApkPopup(false)} />
          <div
            className="relative bg-cover bg-center w-full max-w-sm rounded-2xl p-6 flex flex-col items-center gap-4 shadow-2xl animate-scale-up overflow-hidden"
            style={{
              backgroundImage: `url(${IMAGES[0]})`,
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div className="absolute inset-0 bg-[#003D99]/85 backdrop-blur-[1px]" />
            <div className="relative z-10 flex flex-col items-center gap-4 w-full">
            <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.523 2.264a1.5 1.5 0 0 1 .212 2.112l-5.205 6.868a.754.754 0 0 1-1.048.11.77.77 0 0 1-.11-1.049l5.205-6.868a1.5 1.5 0 0 1 2.112-.212l.834.607ZM6.83 3.166a2.25 2.25 0 0 0-.83 1.792v14.084a2.25 2.25 0 0 0 .83 1.792l.045.035 7.686-7.686a1.126 1.126 0 0 0 0-1.592L6.875 3.134l-.046.035Z"/>
                <path d="m18.566 12.4-4.758 4.758L7.14 10.5a.756.756 0 0 1-.044-1.068.756.756 0 0 1 1.002-.045l11.416 6.66.834.607a1.5 1.5 0 0 0 .213-2.111l-.213-.213-1.782-1.782Z"/>
              </svg>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <h3 className="text-lg font-extrabold text-white">New Update Coming!</h3>
              <p className="text-sm text-white/80 leading-relaxed">
                A fresh version of the RAD5 Café app will be posted in the coming week. You can still download the current version below.
              </p>
            </div>
            <div className="flex flex-col w-full gap-2">
              <a
                href={APK_URL}
                className="w-full py-3 rounded-xl bg-white text-[#003D99] font-bold text-sm hover:bg-gray-100 transition-all cursor-pointer text-center"
              >
                Download Current Version
              </a>
              <button
                onClick={() => setShowApkPopup(false)}
                className="w-full py-2.5 rounded-xl bg-white/15 text-white font-semibold text-sm hover:bg-white/25 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
