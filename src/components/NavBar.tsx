'use client';

import { useState, useEffect } from 'react';
import { AuthButton } from '@/components/auth/AuthButton';

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
          ? 'bg-[#26200D] shadow-[0px_10px_4px_0px_rgba(0,0,0,0.25)] opacity-95' 
          : 'bg-[#26200D] shadow-[0px_10px_4px_0px_rgba(0,0,0,0.25)] opacity-82'
      } h-[100px] rounded-[60px]`}
    >
      <div className="flex justify-between items-center h-full px-8">
        {/* Animated NAVI Logo */}
        <div className="text-[#98CD85] font-bold text-2xl">
          <span className="inline-block hover:transform hover:translate-y-[-2px] hover:scale-110 transition-all duration-200 ease-in-out cursor-pointer">N</span>
          <span className="inline-block hover:transform hover:translate-y-[-2px] hover:scale-110 transition-all duration-200 ease-in-out cursor-pointer">A</span>
          <span className="inline-block hover:transform hover:translate-y-[-2px] hover:scale-110 transition-all duration-200 ease-in-out cursor-pointer">V</span>
          <span className="inline-block hover:transform hover:translate-y-[-2px] hover:scale-110 transition-all duration-200 ease-in-out cursor-pointer">I</span>
        </div>
        
        {/* Auth Button */}
        <div>
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
