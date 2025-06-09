"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { User, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationsDropdown } from "@/components/notifications-dropdown"

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 gray/80 backdrop-blur-md border-b bg-[#1C1C1C] border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center bg-[#1C1C1C] h-16">
          <Link href="/" className="flex items-center">
            <Image 
              src="/wavelength-hero.svg"
              alt="Wavelength Logo"
              width={180}
              height={80}
              className="h-12 w-auto"
              priority
            />
          </Link>

          <div className="flex items-center space-x-4">
            <Link href="/chat">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`text-gray-300 hover:text-white ${pathname === '/chat' ? 'bg-gray-800' : ''}`}
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
            </Link>

            <NotificationsDropdown />

            <Link href="/profile">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`text-gray-300 hover:text-white ${pathname === '/profile' ? 'bg-gray-800' : ''}`}
              >
                <User className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
