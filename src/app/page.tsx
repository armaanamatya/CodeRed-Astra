import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/auth/AuthButton";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="absolute top-4 right-4">
        <AuthButton />
      </div>
      
      <h1 className="text-4xl font-bold">Welcome to CodeRed Astra</h1>
      <p className="mt-4 text-lg">Built with Next.js, TypeScript, Tailwind CSS, and Shadcn UI</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in to access Gmail and Calendar features
      </p>
      
      <div className="mt-8 flex gap-4">
        <Link href="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    </main>
  );
}