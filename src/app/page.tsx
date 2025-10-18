import NavBar from "@/components/NavBar";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background with exact gradient from Figma */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#bcb8b1] to-[#8a817c]" />
      
      {/* Navigation Bar */}
      <NavBar />

      {/* Main Content with exact positioning and styling from Figma */}
      <div className="flex min-h-screen items-center justify-center pt-32 relative z-10">
        <div className="text-center relative z-20">
          <h1 className="text-[107px] font-['Kavoon',_sans-serif] leading-[normal] text-center relative z-30">
            <p className="text-[#f4f3ee] mb-0">WELCOME TO</p>
            <p className="leading-[normal]">
              <span className="text-[rgba(224,175,160,0.98)]">NAVI</span>!
            </p>
          </h1>
        </div>
      </div>

      {/* Additional content sections for testing scroll */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#8a817c] to-[#6c5d5a] relative z-10">
        <div className="text-center max-w-4xl mx-auto px-8 relative z-20">
          <h2 className="text-6xl font-['Kavoon',_sans-serif] text-[#f4f3ee] mb-8 relative z-30">
            About NAVI
          </h2>
          <p className="text-xl text-[#f4f3ee] leading-relaxed relative z-30">
            NAVI is your intelligent assistant designed to help you navigate through your digital life. 
            With seamless integration of Gmail and Calendar features, NAVI makes managing your daily tasks 
            and communications effortless and intuitive.
          </p>
        </div>
      </section>

      <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#6c5d5a] to-[#463f3a] relative z-10">
        <div className="text-center max-w-4xl mx-auto px-8 relative z-20">
          <h2 className="text-6xl font-['Kavoon',_sans-serif] text-[#f4f3ee] mb-8 relative z-30">
            Features
          </h2>
          <div className="grid md:grid-cols-2 gap-8 relative z-30">
            <div className="bg-[#8a817c] bg-opacity-30 p-6 rounded-lg">
              <h3 className="text-2xl font-['Kenia',_sans-serif] text-[#f4f3ee] mb-4">Gmail Integration</h3>
              <p className="text-[#f4f3ee]">
                Seamlessly manage your emails with intelligent organization and quick access to your most important messages.
              </p>
            </div>
            <div className="bg-[#8a817c] bg-opacity-30 p-6 rounded-lg">
              <h3 className="text-2xl font-['Kenia',_sans-serif] text-[#f4f3ee] mb-4">Calendar Management</h3>
              <p className="text-[#f4f3ee]">
                Keep track of your schedule with an intuitive calendar interface that syncs with your Google Calendar.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#463f3a] to-[#2d2a28] relative z-10">
        <div className="text-center max-w-4xl mx-auto px-8 relative z-20">
          <h2 className="text-6xl font-['Kavoon',_sans-serif] text-[#f4f3ee] mb-8 relative z-30">
            Get Started
          </h2>
          <p className="text-xl text-[#f4f3ee] leading-relaxed mb-8 relative z-30">
            Ready to experience the future of digital assistance? Sign in to NAVI and discover how it can 
            transform the way you manage your digital life.
          </p>
          <div className="text-lg text-[rgba(224,175,160,0.98)] relative z-30">
            Scroll up to see the navigation bar in action!
          </div>
        </div>
      </section>
    </main>
  );
}