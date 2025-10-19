'use client';

import { useState, useEffect } from 'react';
import { AuthButton } from '@/components/auth/AuthButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import Image from 'next/image';

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
      className={`fixed top-4 left-4 right-4 z-50 transition-all duration-300 border-2 border-[#98CD85] ${
        isScrolled 
          ? 'bg-[#463F3A] shadow-[0px_10px_4px_0px_rgba(0,0,0,0.25)] opacity-95' 
          : 'bg-[#463F3A] shadow-[0px_10px_4px_0px_rgba(0,0,0,0.25)] opacity-82'
      } h-[60px] rounded-[30px]`}
    >
      <div className="flex justify-between items-center h-full px-8">
        {/* Animated NAVI Logo */}
        <div className="relative text-[#98CD85] font-bold text-2xl navi-logo group cursor-pointer">
          {/* SVG Background - Slides from center to right on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out -z-10">
            <Image
              src="/assets/NaviDarkMode.svg"
              alt="NAVI Logo Background"
              width={120}
              height={40}
              className="transform translate-x-0 group-hover:translate-x-full transition-transform duration-300 ease-out"
            />
          </div>
          
          {/* NAVI Text */}
          <div className="relative z-10">
            <span className="inline-block hover:transform hover:translate-y-[-2px] hover:scale-110 transition-all duration-200 ease-in-out">N</span>
            <span className="inline-block hover:transform hover:translate-y-[-2px] hover:scale-110 transition-all duration-200 ease-in-out">A</span>
            <span className="inline-block hover:transform hover:translate-y-[-2px] hover:scale-110 transition-all duration-200 ease-in-out">V</span>
            <span className="inline-block hover:transform hover:translate-y-[-2px] hover:scale-110 transition-all duration-200 ease-in-out">I</span>
          </div>
        </div>
        
        {/* Right side buttons */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
