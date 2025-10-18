import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/auth/AuthButton";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#8A817C]">
      {/* Transparent Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#BCB8B1] backdrop-blur-sm">
        <div className="flex justify-between items-center px-6 py-4">
          {/* Logo/Brand */}
          <div className="text-[#463f3a] font-bold text-xl">
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
      </nav>
      
      {/* Main Content */}
      <div className="flex min-h-screen flex-col items-center justify-center p-24 pt-32">
      
      <h1 className="text-4xl font-bold text-white">
        WELCOME TO <span className="text-[#E0AFA0]">NAVI</span>!
      </h1>
      <p className="mt-4 text-lg text-white">Built with Next.js, TypeScript, Tailwind CSS, and Shadcn UI</p>
      <p className="mt-2 text-sm text-gray-200">
        Sign in to access Gmail and Calendar features
      </p>
      
        <div className="mt-8 flex gap-4">
          <Link href="/dashboard">
            <Button className="bg-white text-[#8A817C] hover:bg-gray-100">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}