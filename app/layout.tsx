'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [hideBanner, setHideBanner] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // scrolling down & scrolled 100px or more => hide banner
        setHideBanner(true);
      } else {
        // scrolling up => show banner
        setHideBanner(false);
      }
      setLastScrollY(currentScrollY);
    }

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#f9f9f9' }}>
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            backgroundColor: '#fff',
            borderBottom: '1px solid #ddd',
            paddingBottom: '1rem',
            transition: 'transform 0.3s ease',
            transform: hideBanner ? 'translateY(-150px)' : 'translateY(0)', // slide up to hide
          }}
        >
          <Link href="/" style={{ position: 'absolute', top: 20, left: 20, zIndex: 1100 }}>
            <Image src="/icon.png" alt="Home" width={40} height={40} style={{ borderRadius: '50%' }} />
          </Link>

          {/* Container to crop banner height */}
          <div
            style={{
              height: 250,         // desired cropped height
              overflow: 'hidden',  // crop top & bottom visually
              marginTop: 0,       // push banner down to crop top visually (adjust as needed)
              marginBottom: -20,    // crop bottom by margin
              position: 'relative',
              zIndex: 100,
            }}
          >
            <Image
              src="/bannerfix.png"
              alt="Site Banner"
              width={3000}
              height={664}
              style={{
                width: '100%',
                height: 'auto',
                objectFit: 'cover',
                // optionally shift image inside container to crop more top or bottom:
                objectPosition: 'center center', // try 'center top' or 'center 30%' to shift crop
              }}
              priority
            />
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
