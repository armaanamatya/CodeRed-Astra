'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function NavBar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-4 left-4 right-4 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-[#463f3a] shadow-[0px_10px_4px_0px_rgba(0,0,0,0.25)] opacity-95' 
          : 'bg-[#463f3a] shadow-[0px_10px_4px_0px_rgba(0,0,0,0.25)] opacity-82'
      } h-[100px] rounded-[60px]`}
    >
      <div className="flex justify-end items-center h-full px-8">
        <div className="flex gap-6 md:gap-8">
          <Link 
            href="/auth/signin" 
            className="text-[#f4f3ee] text-[18px] md:text-[20px] font-['Kenia',_sans-serif] hover:opacity-80 transition-opacity"
          >
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}
