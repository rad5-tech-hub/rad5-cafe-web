import React, { useEffect, useState } from 'react';

const SLIDE_INTERVAL = 3000;

const slides = [
  'https://images.pexels.com/photos/29445730/pexels-photo-29445730.jpeg',
  'https://images.pexels.com/photos/10885488/pexels-photo-10885488.jpeg',
  'https://images.pexels.com/photos/34932768/pexels-photo-34932768.jpeg',
];

export const AuthBackground: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((i) => (i + 1) % slides.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden z-0">
      {/* Background Slides */}
      {slides.map((source, i) => (
        <img
          key={i}
          src={source}
          alt={`Slide ${i}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            i === activeIndex ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {/* Navy blue gradient overlay matching mobile app exactly */}
      <div
        className="absolute inset-0 bg-gradient-to-b"
        style={{
          backgroundImage: 'linear-gradient(to bottom, transparent 0%, rgba(30, 64, 175, 0.35) 55%, rgba(30, 58, 138, 0.95) 100%)',
        }}
      />
    </div>
  );
};
