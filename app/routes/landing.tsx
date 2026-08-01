import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '~/lib/api';
import { Icon } from '~/components/ui/icon';

const DEFAULT_APK_URL = 'https://firebasestorage.googleapis.com/v0/b/shield-3f2ba.firebasestorage.app/o/apps%2Fcafe1.1.apk?alt=media&token=d15ab3e4-a65c-47ec-b40c-2da3adb55272';

const PASTRY_IMAGES = [
  {
    id: 1,
    url: 'https://images.pexels.com/photos/29445730/pexels-photo-29445730.jpeg',
    title: 'Fresh Butter Croissants',
  },
  {
    id: 2,
    url: 'https://images.pexels.com/photos/10885488/pexels-photo-10885488.jpeg',
    title: 'Artisanal Coffee & Sweets',
  },
  {
    id: 3,
    url: 'https://images.pexels.com/photos/34932768/pexels-photo-34932768.jpeg',
    title: 'Specialty Pastry Box',
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop',
    title: 'Gourmet Fruit Danishes',
  },
];

export function meta() {
  return [
    { title: 'RAD5 Café — Fresh Pastries & Instant Ordering' },
    { name: 'description', content: 'Order lunch before you leave your desk at RAD5 Café.' },
  ];
}

export default function Landing() {
  const [showApkPopup, setShowApkPopup] = useState(false);
  const [apkUrl, setApkUrl] = useState(DEFAULT_APK_URL);
  const [versionInfo, setVersionInfo] = useState<any>(null);
  const [activeIndex, setActiveIndex] = useState(0);

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

  // Automatic image interval rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % PASTRY_IMAGES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col justify-between">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'RAD5 Café',
            applicationCategory: 'FoodApplication',
            operatingSystem: 'Android',
            description: 'Fresh pastries and instant desk ordering for RAD5 Café.',
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

      <div className="relative z-10 max-w-[1180px] w-full mx-auto px-4 py-5 sm:px-8 sm:py-7">
        {/* Promo banner */}
        <div className="flex items-center gap-2.5 mt-2 px-4 py-3 rounded-2xl flex-wrap" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)' }}>
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#F59E0B' }} />
          <span className="text-[13.5px] font-semibold">
            {versionInfo?.version ? `Version ${versionInfo.version} is out` : 'A new app version is out'}
          </span>
          <span className="text-[13.5px] text-text-secondary">— faster checkout and offline receipts.</span>
          <button
            onClick={() => setShowApkPopup(true)}
            className="ml-auto px-3.5 py-2 rounded-lg border-none text-xs font-semibold cursor-pointer whitespace-nowrap"
            style={{ background: 'var(--color-text)', color: 'var(--color-background)' }}
          >
            Download APK
          </button>
        </div>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mt-10 sm:mt-14">
          {/* Text Left */}
          <div className="flex flex-col items-start justify-center">
            <h1 className="font-extrabold tracking-tight leading-[1.05] text-[38px] sm:text-[50px] lg:text-[60px]" style={{ textWrap: 'balance' as any }}>
              Order lunch before you leave your desk.
            </h1>

            <p className="mt-6 text-text-secondary text-base sm:text-xl leading-relaxed">
              Skip the counter queue. Browse daily baked pastries, artisanal coffee, and fresh warm meals prepared and ready when you are.
            </p>

            <Link
              to="/cafe"
              className="mt-10 px-10 py-5 sm:px-12 sm:py-5.5 rounded-2xl border-none bg-tint-dark text-white text-lg sm:text-xl font-extrabold hover:bg-tint hover:-translate-y-1 active:translate-y-0 transition-all shadow-xl hover:shadow-2xl inline-flex items-center justify-center gap-3.5 tracking-wide cursor-pointer"
            >
              <span>Order Now</span>
              <Icon name="arrow-right" size={22} />
            </Link>
          </div>

          {/* Image Right - Tall height, no border, show ONLY images cycling in intervals */}
          <div className="relative w-full h-[480px] sm:h-[560px] lg:h-[620px] overflow-hidden rounded-[28px] shadow-2xl">
            {PASTRY_IMAGES.map((item, idx) => (
              <div
                key={item.id}
                className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                  idx === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* APK Popup Modal */}
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
                This release brings massive improvements and faster offline checkout on Mobile purchases.
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
