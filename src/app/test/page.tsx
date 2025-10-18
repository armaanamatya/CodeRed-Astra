import { Button } from "@/components/ui/button";

export default function TestPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Test Page</h1>
      <p className="mt-4 text-lg">This is a test route in Next.js</p>
      <Button className="mt-6">Go Back Home</Button>
    </main>
  );
}