'use client';

import { useState, useEffect } from 'react';

export function ThemeToggle() {
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to dark mode
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsLightMode(true);
      document.documentElement.classList.add('light');
      
      // Apply light mode styles on page load
      const style = document.createElement('style');
      style.id = 'light-mode-override';
      style.textContent = `
        body { background-color: #F2ECD9 !important; color: #1F5C0A !important; }
        main { background-color: #F2ECD9 !important; }
        .bg-\\[\\#26200D\\] { background-color: #F2ECD9 !important; }
        .text-\\[\\#98CD85\\] { color: #1F5C0A !important; }
        .border-\\[\\#98CD85\\] { border-color: #1F5C0A !important; }
        .bg-\\[\\#463F3A\\] { background-color: #F2ECD9 !important; }
        section { background-color: #F2ECD9 !important; }
        .absolute.inset-0 { background-color: #F2ECD9 !important; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isLightMode;
    setIsLightMode(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
      console.log('Light mode enabled - class added to html element');
      
      // Force apply light mode styles directly
      const style = document.createElement('style');
      style.id = 'light-mode-override';
      style.textContent = `
        body { background-color: #F2ECD9 !important; color: #1F5C0A !important; }
        main { background-color: #F2ECD9 !important; }
        .bg-\\[\\#26200D\\] { background-color: #F2ECD9 !important; }
        .text-\\[\\#98CD85\\] { color: #1F5C0A !important; }
        .border-\\[\\#98CD85\\] { border-color: #1F5C0A !important; }
        .bg-\\[\\#463F3A\\] { background-color: #F2ECD9 !important; }
        section { background-color: #F2ECD9 !important; }
        .absolute.inset-0 { background-color: #F2ECD9 !important; }
      `;
      document.head.appendChild(style);
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
      console.log('Dark mode enabled - class removed from html element');
      
      // Remove light mode override styles
      const existingStyle = document.getElementById('light-mode-override');
      if (existingStyle) {
        existingStyle.remove();
      }
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-colors duration-200 ${
        isLightMode 
          ? 'bg-[#1F5C0A] hover:bg-[#2A7A0F]' 
          : 'bg-[#98CD85] hover:bg-[#7AB370]'
      }`}
      aria-label={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {isLightMode ? (
        // Moon icon for light mode (click to go dark)
        <svg className="w-5 h-5 text-[#F2ECD9]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        // Sun icon for dark mode (click to go light)
        <svg className="w-5 h-5 text-[#26200D]" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}
