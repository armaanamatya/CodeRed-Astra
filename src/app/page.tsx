'use client';

import NavBar from "@/components/NavBar";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
// import { AlertTriangle, CheckCircle } from "lucide-react";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return null;
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-[#26200D]" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#26200D] via-[#2A2A1A] to-[#1F1F0F] opacity-90" />
      
      {/* Navigation Bar */}
      <NavBar />

      {/* Enhanced Hero Section */}
      <div className="flex min-h-screen items-center justify-center pt-32 relative z-10">
        <div className="text-center relative z-20 max-w-6xl mx-auto px-8">
          {/* Main Headline */}
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl lg:text-[107px] leading-tight text-center relative z-30 mb-6">
              <p className="text-[#98CD85] mb-2 text-2xl md:text-3xl font-light tracking-wider">Welcome To</p>
              <p className="leading-tight">
                <span className="text-[#98CD85] navi-logo relative group cursor-pointer inline-block">
                  <div className="relative z-10">
                    <span className="inline-block hover:transform hover:translate-y-[-2px] hover:scale-110 transition-all duration-200 ease-in-out">N</span>
                    <span className="inline-block hover:transform hover:translate-y-[-2px] hover:scale-110 transition-all duration-200 ease-in-out">A</span>
                    <span className="inline-block hover:transform hover:translate-y-[-2px] hover:scale-110 transition-all duration-200 ease-in-out">V</span>
                    <span className="inline-block hover:transform hover:translate-y-[-2px] hover:scale-110 transition-all duration-200 ease-in-out">I</span>
                  </div>
                </span><span className="text-[#98CD85]">!</span>
              </p>
            </h1>
          </div>

          {/* Subheading and Value Proposition */}
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl text-[#98CD85] font-light mb-6 leading-relaxed">
              Your Intelligent Digital Assistant
            </h2>
            <p className="text-lg md:text-xl text-[#98CD85] opacity-90 max-w-4xl mx-auto leading-relaxed mb-8">
              Streamline your digital life with seamless Gmail and Calendar integration. 
              NAVI transforms how you manage emails, schedule meetings, and stay organized.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button 
              onClick={() => router.push('/auth/signin')}
              className="bg-[#98CD85] text-[#26200D] px-8 py-4 rounded-full text-lg font-semibold hover:bg-[#7AB370] hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Get Started Free
            </button>
            <button 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-2 border-[#98CD85] text-[#98CD85] px-8 py-4 rounded-full text-lg font-semibold hover:bg-[#98CD85] hover:text-[#26200D] transition-all duration-200"
            >
              Learn More
            </button>
          </div>

          {/* Social Proof */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-[#98CD85] opacity-80">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#98CD85] rounded-full"></div>
              <span className="text-sm">Trusted by 10,000+ users</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#98CD85] rounded-full"></div>
              <span className="text-sm">99.9% uptime</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#98CD85] rounded-full"></div>
              <span className="text-sm">Enterprise security</span>
            </div>
          </div>
        </div>
      </div>

      {/* Value Proposition Section */}
      <section className="min-h-screen flex items-center justify-center relative z-10 py-20">
        <div className="max-w-6xl mx-auto px-8 relative z-20">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl text-[#98CD85] mb-8 font-light">
              Why Choose <span className="navi-logo">NAVI</span>?
            </h2>
            <p className="text-xl text-[#98CD85] opacity-90 max-w-3xl mx-auto leading-relaxed">
              Stop juggling multiple apps and platforms. NAVI brings everything together in one intelligent, 
              seamless experience that adapts to your workflow.
            </p>
          </div>

          {/* Problem/Solution Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-gradient-to-br from-[#2A2A1A] to-[#1F1F0F] p-8 rounded-2xl border border-[#98CD85] shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="w-12 h-12 bg-[#98CD85] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#26200D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-2xl text-[#98CD85] mb-4 font-semibold">The Challenge</h3>
              <p className="text-[#98CD85] opacity-90 leading-relaxed">
                Managing emails, calendars, and tasks across multiple platforms is time-consuming and error-prone. 
                You're constantly switching between apps, missing important messages, and struggling to stay organized.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-[#2A2A1A] to-[#1F1F0F] p-8 rounded-2xl border border-[#98CD85] shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="w-12 h-12 bg-[#98CD85] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#26200D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl text-[#98CD85] mb-4 font-semibold">Our Solution</h3>
              <p className="text-[#98CD85] opacity-90 leading-relaxed">
                NAVI unifies your digital workspace with intelligent automation, smart scheduling, 
                and seamless integration. Focus on what matters while we handle the rest.
              </p>
            </div>
          </div>

          {/* Key Benefits */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#98CD85] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#26200D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl text-[#98CD85] mb-3 font-semibold">Lightning Fast</h3>
              <p className="text-[#98CD85] opacity-80">Get things done 3x faster with intelligent automation</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#98CD85] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#26200D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl text-[#98CD85] mb-3 font-semibold">Enterprise Security</h3>
              <p className="text-[#98CD85] opacity-80">Bank-level encryption keeps your data safe and private</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#98CD85] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#26200D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl text-[#98CD85] mb-3 font-semibold">Smart Insights</h3>
              <p className="text-[#98CD85] opacity-80">AI-powered recommendations optimize your productivity</p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section id="features" className="min-h-screen flex items-center justify-center relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-8 relative z-20">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl text-[#98CD85] mb-8 font-light">
              Powerful Features
            </h2>
            <p className="text-xl text-[#98CD85] opacity-90 max-w-3xl mx-auto leading-relaxed">
              Everything you need to manage your digital life, all in one place
            </p>
          </div>

          {/* Main Features Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* Gmail Integration */}
            <div className="bg-gradient-to-br from-[#2A2A1A] to-[#1F1F0F] p-8 rounded-2xl border border-[#98CD85] shadow-xl hover:shadow-2xl transition-all duration-300 group">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-[#98CD85] rounded-lg flex items-center justify-center mr-4">
                  <span className="text-[#26200D] text-xl font-bold">@</span>
                </div>
                <h3 className="text-3xl text-[#98CD85] font-semibold">Smart Email Management</h3>
              </div>
              <p className="text-[#98CD85] opacity-90 leading-relaxed mb-6">
                Intelligent email organization, smart filtering, and instant search across all your accounts. 
                Never miss an important message again.
              </p>
              <ul className="space-y-3 text-[#98CD85] opacity-80">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#98CD85] rounded-full mr-3"></span>
                  AI-powered email categorization
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#98CD85] rounded-full mr-3"></span>
                  Smart reply suggestions
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#98CD85] rounded-full mr-3"></span>
                  Priority inbox filtering
                </li>
              </ul>
            </div>

            {/* Calendar Management */}
            <div className="bg-gradient-to-br from-[#2A2A1A] to-[#1F1F0F] p-8 rounded-2xl border border-[#98CD85] shadow-xl hover:shadow-2xl transition-all duration-300 group">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-[#98CD85] rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-[#26200D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-3xl text-[#98CD85] font-semibold">Intelligent Scheduling</h3>
              </div>
              <p className="text-[#98CD85] opacity-90 leading-relaxed mb-6">
                Smart calendar integration with automatic meeting scheduling, conflict detection, 
                and intelligent time blocking.
              </p>
              <ul className="space-y-3 text-[#98CD85] opacity-80">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#98CD85] rounded-full mr-3"></span>
                  Auto-schedule meetings
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#98CD85] rounded-full mr-3"></span>
                  Smart conflict resolution
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#98CD85] rounded-full mr-3"></span>
                  Focus time optimization
                </li>
              </ul>
            </div>
          </div>

          {/* Additional Features */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-[#2A2A1A] to-[#1F1F0F] p-6 rounded-xl border border-[#98CD85] shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-10 h-10 bg-[#98CD85] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-[#26200D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h4 className="text-xl text-[#98CD85] mb-3 font-semibold">AI Assistant</h4>
              <p className="text-[#98CD85] opacity-80 text-sm">Natural language processing for smart task management</p>
            </div>

            <div className="bg-gradient-to-br from-[#2A2A1A] to-[#1F1F0F] p-6 rounded-xl border border-[#98CD85] shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-10 h-10 bg-[#98CD85] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-[#26200D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12.828 7H4.828zM4.828 7H3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-1.828M4.828 7L7.414 4.414a2 2 0 012.828 0L12.828 7" />
                </svg>
              </div>
              <h4 className="text-xl text-[#98CD85] mb-3 font-semibold">Smart Notifications</h4>
              <p className="text-[#98CD85] opacity-80 text-sm">Context-aware alerts that actually help you focus</p>
            </div>

            <div className="bg-gradient-to-br from-[#2A2A1A] to-[#1F1F0F] p-6 rounded-xl border border-[#98CD85] shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-10 h-10 bg-[#98CD85] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-[#26200D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-xl text-[#98CD85] mb-3 font-semibold">Analytics</h4>
              <p className="text-[#98CD85] opacity-80 text-sm">Insights into your productivity patterns and habits</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="min-h-screen flex items-center justify-center relative z-10 py-20">
        <div className="max-w-6xl mx-auto px-8 relative z-20">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl text-[#98CD85] mb-8 font-light">
              Loved by Users
            </h2>
            <p className="text-xl text-[#98CD85] opacity-90 max-w-3xl mx-auto leading-relaxed">
              See what our users are saying about NAVI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-gradient-to-br from-[#2A2A1A] to-[#1F1F0F] p-8 rounded-2xl border border-[#98CD85] shadow-xl">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-[#98CD85] rounded-full flex items-center justify-center mr-4">
                  <span className="text-xl font-bold text-[#26200D]">SJ</span>
                </div>
                <div>
                  <h4 className="text-[#98CD85] font-semibold">Sarah Johnson</h4>
                  <p className="text-[#98CD85] opacity-70 text-sm">Product Manager</p>
                </div>
              </div>
              <p className="text-[#98CD85] opacity-90 italic">
                "NAVI has completely transformed how I manage my emails and calendar. 
                I save at least 2 hours every day with their smart automation."
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#2A2A1A] to-[#1F1F0F] p-8 rounded-2xl border border-[#98CD85] shadow-xl">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-[#98CD85] rounded-full flex items-center justify-center mr-4">
                  <span className="text-xl font-bold text-[#26200D]">MC</span>
                </div>
                <div>
                  <h4 className="text-[#98CD85] font-semibold">Mike Chen</h4>
                  <p className="text-[#98CD85] opacity-70 text-sm">Startup Founder</p>
                </div>
              </div>
              <p className="text-[#98CD85] opacity-90 italic">
                "The AI assistant is incredible. It actually understands context and 
                helps me stay focused on what matters most."
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#2A2A1A] to-[#1F1F0F] p-8 rounded-2xl border border-[#98CD85] shadow-xl">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-[#98CD85] rounded-full flex items-center justify-center mr-4">
                  <span className="text-xl font-bold text-[#26200D]">AL</span>
                </div>
                <div>
                  <h4 className="text-[#98CD85] font-semibold">Alex Rodriguez</h4>
                  <p className="text-[#98CD85] opacity-70 text-sm">Consultant</p>
                </div>
              </div>
              <p className="text-[#98CD85] opacity-90 italic">
                "Finally, a tool that actually makes me more productive instead of 
                adding to the noise. NAVI is a game-changer."
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-[#98CD85] mb-2">10K+</div>
              <div className="text-[#98CD85] opacity-80">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#98CD85] mb-2">99.9%</div>
              <div className="text-[#98CD85] opacity-80">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#98CD85] mb-2">2.5hrs</div>
              <div className="text-[#98CD85] opacity-80">Daily Time Saved</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#98CD85] mb-2">4.9★</div>
              <div className="text-[#98CD85] opacity-80">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="min-h-screen flex items-center justify-center relative z-10 py-20">
        <div className="text-center max-w-5xl mx-auto px-8 relative z-20">
          <h2 className="text-5xl md:text-6xl text-[#98CD85] mb-8 font-light">
            Ready to Transform Your Productivity?
          </h2>
          <p className="text-xl text-[#98CD85] opacity-90 max-w-3xl mx-auto leading-relaxed mb-12">
            Join thousands of professionals who have already discovered the power of NAVI. 
            Start your free trial today and experience the future of digital assistance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <button 
              onClick={() => router.push('/auth/signin')}
              className="bg-[#98CD85] text-[#26200D] px-12 py-6 rounded-full text-xl font-bold hover:bg-[#7AB370] hover:scale-105 transition-all duration-200 shadow-2xl hover:shadow-3xl"
            >
              Start Free Trial
            </button>
            <button 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-2 border-[#98CD85] text-[#98CD85] px-12 py-6 rounded-full text-xl font-bold hover:bg-[#98CD85] hover:text-[#26200D] transition-all duration-200"
            >
              View Features
            </button>
          </div>

          <div className="text-[#98CD85] opacity-70">
            <p className="mb-2">No credit card required • 14-day free trial • Cancel anytime</p>
            <p>Enterprise-grade security • GDPR compliant • SOC 2 certified</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-[#1F1F0F] to-[#26200D] border-t border-[#98CD85] py-16">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <span className="text-3xl font-bold text-[#98CD85] navi-logo">NAVI</span>
              </div>
              <p className="text-[#98CD85] opacity-80 mb-6 max-w-md">
                Your intelligent digital assistant for seamless email and calendar management. 
                Transform your productivity with AI-powered automation.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-[#98CD85] rounded-lg flex items-center justify-center">
                  <span className="text-[#26200D] text-sm font-bold">T</span>
                </div>
                <div className="w-10 h-10 bg-[#98CD85] rounded-lg flex items-center justify-center">
                  <span className="text-[#26200D] text-sm font-bold">L</span>
                </div>
                <div className="w-10 h-10 bg-[#98CD85] rounded-lg flex items-center justify-center">
                  <span className="text-[#26200D] text-sm font-bold">G</span>
                </div>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="text-lg text-[#98CD85] font-semibold mb-4">Product</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-[#98CD85] opacity-80 hover:opacity-100 transition-opacity">Features</a></li>
                <li><a href="#" className="text-[#98CD85] opacity-80 hover:opacity-100 transition-opacity">Pricing</a></li>
                <li><a href="#" className="text-[#98CD85] opacity-80 hover:opacity-100 transition-opacity">Integrations</a></li>
                <li><a href="#" className="text-[#98CD85] opacity-80 hover:opacity-100 transition-opacity">API</a></li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h4 className="text-lg text-[#98CD85] font-semibold mb-4">Support</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-[#98CD85] opacity-80 hover:opacity-100 transition-opacity">Help Center</a></li>
                <li><a href="#" className="text-[#98CD85] opacity-80 hover:opacity-100 transition-opacity">Documentation</a></li>
                <li><a href="#" className="text-[#98CD85] opacity-80 hover:opacity-100 transition-opacity">Contact Us</a></li>
                <li><a href="#" className="text-[#98CD85] opacity-80 hover:opacity-100 transition-opacity">Status</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-[#98CD85] pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-[#98CD85] opacity-70 text-sm mb-4 md:mb-0">
                © 2024 NAVI. All rights reserved.
              </div>
              <div className="flex space-x-6 text-sm">
                <a href="#" className="text-[#98CD85] opacity-70 hover:opacity-100 transition-opacity">Privacy Policy</a>
                <a href="#" className="text-[#98CD85] opacity-70 hover:opacity-100 transition-opacity">Terms of Service</a>
                <a href="#" className="text-[#98CD85] opacity-70 hover:opacity-100 transition-opacity">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}