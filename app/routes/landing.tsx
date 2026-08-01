import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '~/lib/api';
import { useTheme } from '~/context/theme-context';
import { Icon } from '~/components/ui/icon';
import { IconButton } from '~/components/ui/icon-button';
import { Money } from '~/components/ui/money';

const DEFAULT_APK_URL = 'https://firebasestorage.googleapis.com/v0/b/shield-3f2ba.firebasestorage.app/o/apps%2Fcafe1.1.apk?alt=media&token=d15ab3e4-a65c-47ec-b40c-2da3adb55272';

const PREVIEW_TXNS = [
  { label: 'Café order — Jollof Rice, Chapman', when: 'Today, 12:41', amount: -4000, dot: 'var(--color-tint)' },
  { label: 'Wallet funding — Paystack', when: 'Today, 09:12', amount: 10000, dot: '#10B981' },
  { label: 'Loyalty reward — Silver bonus', when: 'Yesterday, 18:03', amount: 500, dot: '#3B82F6' },
];

export function meta() {
  return [
    { title: 'RAD5 Café — Smart Wallet & Instant Ordering' },
    { name: 'description', content: 'Fund your RAD5 wallet once, then pay for meals with a 4-digit PIN. Earn points on every order and skip the counter queue.' },
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
  const { effectiveTheme, toggleTheme } = useTheme();
  const [showApkPopup, setShowApkPopup] = useState(false);
  const [apkUrl, setApkUrl] = useState(DEFAULT_APK_URL);
  const [versionInfo, setVersionInfo] = useState<any>(null);

  useEffect(() => {
    api.version.check('android')
      .then((res) => {
        if (res.success && res.data) {
          setVersionInfo(res.data);
          if (res.data.apkLink) setApkUrl(res.data.apkLink);
        }
      })
      .catch((err) => console.warn('Failed to fetch latest version info:', err));
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
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
            downloadUrl: apkUrl,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'NGN' },
            provider: { '@type': 'Organization', name: 'RAD5 Tech Hub' },
          }),
        }}
      />

      {/* Ambient glass background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-44 -left-28 w-[620px] h-[620px] rounded-full" style={{ background: 'radial-gradient(circle at 30% 30%, var(--tint-c), rgba(0,61,153,0) 70%)' }} />
        <div className="absolute top-28 -right-40 w-[560px] h-[560px] rounded-full" style={{ background: 'radial-gradient(circle at 60% 40%, rgba(59,130,246,0.22), rgba(59,130,246,0) 70%)' }} />
        <div className="absolute -bottom-56 left-[34%] w-[680px] h-[520px] rounded-full" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(16,185,129,0.14), rgba(16,185,129,0) 72%)' }} />
      </div>

      <div className="relative z-10 max-w-[1180px] mx-auto px-4 py-5 sm:px-8 sm:py-7 pb-16">
        {/* Navbar */}
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl glass-surface">
          <div className="flex items-center gap-2.5">
            <img src="/RAD5 Cafe.svg" alt="RAD5 Café" className="w-[30px] h-[30px] rounded-[9px]" />
            <span className="font-extrabold tracking-tight text-[17px]">RAD5 Café</span>
          </div>
          <div className="flex items-center gap-2.5">
            <IconButton icon={effectiveTheme === 'dark' ? 'sun' : 'moon'} onClick={toggleTheme} title="Toggle theme" />
            <Link
              to="/login"
              className="hidden sm:inline-flex px-4 py-2.5 rounded-xl border border-border glass-chip text-sm font-semibold hover:border-tint hover:text-tint transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="px-4 py-2.5 rounded-xl border-none bg-tint-dark text-white text-sm font-semibold hover:bg-tint transition-colors"
            >
              Create account
            </Link>
          </div>
        </div>

        {/* Promo banner */}
        <div className="flex items-center gap-2.5 mt-4 px-4 py-3 rounded-2xl flex-wrap" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)' }}>
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#F59E0B' }} />
          <span className="text-[13.5px] font-semibold">
            {versionInfo?.version ? `Version ${versionInfo.version} is out` : 'A new app version is out'}
          </span>
          <span className="text-[13.5px] text-text-secondary">— faster wallet checkout and offline receipts.</span>
          <button
            onClick={() => setShowApkPopup(true)}
            className="ml-auto px-3.5 py-2 rounded-lg border-none text-xs font-semibold cursor-pointer whitespace-nowrap"
            style={{ background: 'var(--color-text)', color: 'var(--color-background)' }}
          >
            Download APK
          </button>
        </div>

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-9 items-center mt-10 sm:mt-14">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-tint-b text-tint text-[12.5px] font-bold tracking-wide">
              CAMPUS CAFÉ WALLET
            </div>
            <h1 className="mt-4 font-extrabold tracking-tight leading-[1.02] text-[36px] sm:text-[46px] lg:text-[58px]" style={{ textWrap: 'balance' as any }}>
              Order lunch before you leave your desk.
            </h1>
            <p className="mt-5 text-text-secondary text-base sm:text-lg leading-relaxed max-w-[46ch]">
              Fund your RAD5 wallet once, then pay for meals with a 4-digit PIN. Earn points on every order and skip the counter queue.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <Link
                to="/register"
                className="px-6 py-3.5 rounded-xl border-none bg-tint-dark text-white text-[15px] font-bold hover:bg-tint hover:-translate-y-px transition-all shadow-lg"
              >
                Open a wallet
              </Link>
              <Link
                to="/login"
                className="px-6 py-3.5 rounded-xl border border-border glass-chip text-[15px] font-semibold hover:border-tint hover:text-tint transition-colors"
              >
                I already have one
              </Link>
            </div>
            <div className="flex flex-wrap gap-8 mt-10">
              <div>
                <div className="font-money text-2xl font-semibold tracking-tight">1,240</div>
                <div className="text-[12.5px] text-text-secondary mt-0.5">wallets funded</div>
              </div>
              <div>
                <div className="font-money text-2xl font-semibold tracking-tight">38s</div>
                <div className="text-[12.5px] text-text-secondary mt-0.5">average order time</div>
              </div>
              <div>
                <div className="font-money text-2xl font-semibold tracking-tight">4 tiers</div>
                <div className="text-[12.5px] text-text-secondary mt-0.5">loyalty rewards</div>
              </div>
            </div>
          </div>

          {/* Wallet preview card */}
          <div className="p-5 rounded-[24px] glass-surface">
            <div className="p-5 rounded-2xl text-white" style={{ background: 'linear-gradient(150deg, #00296B, #003D99 60%, #3B82F6)' }}>
              <div className="text-[12.5px] opacity-80 tracking-wide">WALLET BALANCE</div>
              <div className="font-money text-[34px] font-semibold mt-2 tracking-tight">₦18,450</div>
              <div className="flex gap-2 mt-4">
                {['Fund', 'Transfer', 'Order'].map((label) => (
                  <div key={label} className="flex-1 py-2.5 text-center rounded-xl bg-white/[0.18] text-[12.5px] font-semibold">
                    {label}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-2.5">
              {PREVIEW_TXNS.map((t) => (
                <div key={t.label} className="flex items-center gap-3 px-3.5 py-3 rounded-[13px] glass-chip">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.dot }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-semibold truncate">{t.label}</div>
                    <div className="text-[11.5px] text-text-secondary">{t.when}</div>
                  </div>
                  <Money amount={t.amount} showSign className="text-[13.5px] font-semibold" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* APK Popup */}
      {showApkPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setShowApkPopup(false)} />
          <div className="relative w-full max-w-sm p-6 rounded-[22px] glass-sheet flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-tint-b flex items-center justify-center text-tint">
              <Icon name="download" size={26} />
            </div>
            <div className="flex flex-col items-center gap-1">
              <h3 className="text-lg font-extrabold">
                {versionInfo?.version ? `New Mobile Update (v${versionInfo.version})!` : 'New Mobile Update Available!'}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                This release brings massive improvements and up to 5% cashback rewards on Mobile purchases.
              </p>
              {versionInfo?.releaseNotes && (
                <div className="mt-2 glass-chip p-2.5 rounded-lg text-xs text-left w-full max-h-24 overflow-y-auto">
                  <span className="font-bold block mb-1 text-[10px] uppercase tracking-wider text-text-secondary">What's New:</span>
                  {versionInfo.releaseNotes}
                </div>
              )}
            </div>
            <div className="flex flex-col w-full gap-2">
              <a
                href={apkUrl}
                className="w-full py-3 rounded-xl bg-tint-dark text-white font-bold text-sm hover:bg-tint transition-colors text-center"
              >
                Download APK
              </a>
              <button
                onClick={() => setShowApkPopup(false)}
                className="w-full py-2.5 rounded-xl glass-chip font-semibold text-sm hover:border-tint transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
