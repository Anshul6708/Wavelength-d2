"use client"

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center bg-black text-white p-4">
      <div className="flex flex-col items-center mt-[10vh]">
        <h1 className="text-5xl font-light mb-12">Wavelength</h1>
        <p className="text-3xl text-gray-400 italic mb-12">Only meet people of your wavelength</p>
        <button
          onClick={() => router.push('/chat')}
          className="border border-white rounded-full px-8 py-3 text-1xl hover:bg-white hover:text-black transition-colors italic mb-12"
        >
          Start the experience 
        </button>

        <div className="relative w-[300px] h-[200px]">
          <Image
            src="/wavelength-hero.svg"
            alt="Wavelength illustration"
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
      </div>
    </main>
  );
}
