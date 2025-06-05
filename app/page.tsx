"use client"

import { useState, useEffect } from "react"
import { SignupModal } from "@/components/signup-modal"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HomePage() {
  const [showSignupModal, setShowSignupModal] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        setShowSignupModal(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [user])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-purple-900">
      <div className="text-center space-y-8">
        <h1 className="text-8xl md:text-9xl font-bold gradient-text animate-pulse">Wavelength</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Discover your unique wavelength through AI-powered conversations
        </p>

        {user ? (
          <div className="space-y-4">
            <p className="text-gray-400">Welcome back!</p>
            <Link href="/chat">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg">
                Continue Chatting
              </Button>
            </Link>
          </div>
        ) : (
          <Button
            onClick={() => setShowSignupModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
          >
            Get Started
          </Button>
        )}
      </div>

      <SignupModal isOpen={showSignupModal} onClose={() => setShowSignupModal(false)} />
    </div>
  )
}
