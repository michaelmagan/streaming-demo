import { StreamingDemo } from "@/app/components/StreamingDemo";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto py-12">
        <h1 className="text-3xl font-bold text-center mb-8">Zod Stream Demo</h1>
        <StreamingDemo />
      </div>
    </main>
  );
}
