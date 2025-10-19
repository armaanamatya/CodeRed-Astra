import NavBar from "@/components/NavBar";
import Image from "next/image";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background with solid color */}
      <div className="absolute inset-0 bg-[#26200D]" />
      
      {/* Navigation Bar */}
      <NavBar />

      {/* Main Content with exact positioning and styling from Figma */}
      <div className="flex min-h-screen items-center justify-center pt-32 relative z-10">
        <div className="text-center relative z-20">
          <h1 className="text-[107px]  leading-[normal] text-center relative z-30">
            <p className="text-[#98CD85] mb-0">Welcome To</p>
            <p className="leading-[normal]">
              <span className="text-[#98CD85] navi-logo relative group cursor-pointer inline-block">
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
                <span className="relative z-10">NAVI</span>
              </span><span className="text-[#98CD85]">!</span>
            </p>
          </h1>
        </div>
      </div>

      {/* Additional content sections for testing scroll */}
      <section className="min-h-screen flex items-center justify-center bg-[#26200D] relative z-10">
        <div className="text-center max-w-4xl mx-auto px-8 relative z-20">
          <h2 className="text-6xl  text-[#98CD85] mb-8 relative z-30">
            About <span className="text-[#98CD85] navi-logo">NAVI</span>
          </h2>
          <p className="text-xl  text-[#98CD85] leading-relaxed relative z-30">
            NAVI is your intelligent assistant designed to help you navigate through your digital life. 
            With seamless integration of Gmail and Calendar features, <span className="text-[#98CD85] navi-logo">NAVI</span> makes managing your daily tasks 
            and communications effortless and intuitive.
          </p>
        </div>
      </section>

      <section className="min-h-screen flex items-center justify-center bg-[#26200D] relative z-10">
        <div className="text-center max-w-4xl mx-auto px-8 relative z-20">  
          <h2 className="text-6xl  text-[#98CD85] mb-8 relative z-30">
            Features
          </h2>
          <div className="grid md:grid-cols-2 gap-8 relative z-30">
            <div className="bg-[#26200D] border-2 border-[#98CD85] p-6 rounded-lg">
              <h3 className="text-2xl  text-[#98CD85] mb-4">Gmail Integration</h3>
              <p className="text-[#98CD85] ">
                Seamlessly manage your emails with intelligent organization and quick access to your most important messages.
              </p>
            </div>
            <div className="bg-[#26200D] border-2 border-[#98CD85] p-6 rounded-lg">
              <h3 className="text-2xl  text-[#98CD85] mb-4">Calendar Management</h3>
              <p className="text-[#98CD85] ">
                Keep track of your schedule with an intuitive calendar interface that syncs with your Google Calendar.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="min-h-screen flex items-center justify-center bg-[#26200D] relative z-10">
        <div className="text-center max-w-4xl mx-auto px-8 relative z-20">
          <h2 className="text-6xl  text-[#98CD85] mb-8 relative z-30">
            Get Started
          </h2>
          <p className="text-xl  text-[#98CD85] leading-relaxed mb-8 relative z-30">
            Ready to experience the future of digital assistance? Sign in to NAVI and discover how it can 
            transform the way you manage your digital life.
          </p>
          <div className="text-lg  text-[#98CD85] relative z-30">
            Scroll up to see the navigation bar in action!
          </div>
        </div>
      </section>
    </main>
  );
}