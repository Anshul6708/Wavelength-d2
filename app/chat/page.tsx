"use client"

import { useChat } from "ai/react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, Sparkles, Plus, MessageSquare } from "lucide-react"
import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ChatHeader } from "@/components/chat-header"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const { user, updateUser } = useAuth()
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [selectedChat, setSelectedChat] = useState<number>(0)
  const [currentMessages, setCurrentMessages] = useState<Message[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  // Initialize chat history if needed
  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    if (!Array.isArray(user.chatHistory) || user.chatHistory.length === 0) {
      updateUser({ chatHistory: [[]] })
    }
  }, [user, router, updateUser])

  // Load selected chat messages whenever the selected chat changes
  useEffect(() => {
    if (!user?.chatHistory?.[selectedChat]) return
    
    const chatMessages = user.chatHistory[selectedChat].map(msg => ({
      id: Math.random().toString(),
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp)
    }))
    setCurrentMessages(chatMessages)
  }, [selectedChat, user?.chatHistory])

  // Save messages to localStorage whenever they change
  const saveMessagesRef = useRef(false)
  
  useEffect(() => {
    if (!user || isSaving || !saveMessagesRef.current) {
      saveMessagesRef.current = true
      return
    }

    const saveMessages = async () => {
      try {
        setIsSaving(true)
        const newChatHistory = [...user.chatHistory]
        newChatHistory[selectedChat] = currentMessages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        }))
        await updateUser({ chatHistory: newChatHistory })
      } catch (error) {
        console.error('Error saving messages:', error)
      } finally {
        setIsSaving(false)
      }
    }

    const timeoutId = setTimeout(saveMessages, 1000)
    return () => clearTimeout(timeoutId)
  }, [currentMessages, user, selectedChat, updateUser, isSaving])

  const { input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    id: selectedChat.toString(),
    initialMessages: currentMessages,
    onFinish: async (message: { content: string }) => {
      const newAssistantMessage = {
        id: Math.random().toString(),
        role: "assistant" as const,
        content: message.content,
        timestamp: new Date()
      }
      setCurrentMessages(prev => [...prev, newAssistantMessage])
    },
  })

  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !user) return

    const newUserMessage = {
      id: Math.random().toString(),
      role: "user" as const,
      content: input,
      timestamp: new Date()
    }

    // Update messages immediately
    setCurrentMessages(prev => [...prev, newUserMessage])

    // Submit to API
    await handleSubmit(e)
  }, [input, user, handleSubmit])

  const startNewChat = useCallback(() => {
    if (!user) return
    
    const newChatHistory = [...user.chatHistory, []]
    updateUser({ chatHistory: newChatHistory })
    setSelectedChat(newChatHistory.length - 1)
    setCurrentMessages([])
  }, [user, updateUser])

  const generateProfileSummary = async () => {
    if (!user) return

    try {
      const response = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatHistory: user.chatHistory.flat() }),
      })

      const { summary } = await response.json()
      updateUser({ profileSummary: summary })
    } catch (error) {
      console.error("Failed to generate summary:", error)
    }
  }

  // Add scroll handler to detect when user manually scrolls
  useEffect(() => {
    const chatContainer = chatContainerRef.current
    if (!chatContainer) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
      setShouldAutoScroll(isAtBottom)
    }

    chatContainer.addEventListener('scroll', handleScroll)
    return () => chatContainer.removeEventListener('scroll', handleScroll)
  }, [])

  // Smart scroll effect that respects user scrolling
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [currentMessages, shouldAutoScroll])

  if (!user) return null

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 p-4 flex flex-col">
        <Button
          onClick={startNewChat}
          className="mb-4 bg-purple-600 hover:bg-purple-700 w-full"
        >
          <Plus className="h-4 w-4 mr-2" /> New Chat
        </Button>
        
        <div className="flex-1 overflow-y-auto">
          <Accordion type="single" collapsible className="space-y-2">
            {user.chatHistory?.map((chat, index) => {
              const firstMessage = chat[0]?.content || "New Chat"
              const preview = firstMessage.length > 30 
                ? firstMessage.substring(0, 30) + "..."
                : firstMessage
              
              return (
                <AccordionItem 
                  key={index} 
                  value={`chat-${index}`}
                  className="border border-gray-800 rounded-lg overflow-hidden"
                >
                  <AccordionTrigger 
                    className={`px-3 py-2 text-sm ${
                      selectedChat === index ? "bg-purple-900/30" : "hover:bg-gray-800"
                    }`}
                    onClick={(e) => {
                      e.preventDefault()
                      setSelectedChat(index)
                    }}
                  >
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      <span className="text-left">{preview}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="bg-gray-800/50 px-3 py-2">
                    <div className="text-xs text-gray-400">
                      {chat.length} messages
                      <br />
                      {chat[chat.length - 1]?.timestamp 
                        ? new Date(chat[chat.length - 1].timestamp).toLocaleDateString()
                        : "No messages"}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatHeader />
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto space-y-4 p-4"
        >
          {currentMessages.length === 0 && (
            <Card className="bg-gray-900 border-gray-800 p-6 text-center">
              <Sparkles className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Welcome to your Wavelength chat</h2>
              <p className="text-gray-400">
                Start a conversation to discover your unique wavelength. I'll help you explore your thoughts, interests,
                and personality.
              </p>
            </Card>
          )}

          {currentMessages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.role === "user" ? "bg-purple-600 text-white" : "bg-gray-800 text-white"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 text-white px-4 py-2 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleFormSubmit} className="p-4 border-t border-gray-800">
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Share your thoughts..."
              className="flex-1 bg-gray-800 border-gray-700 text-white"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()} className="bg-purple-600 hover:bg-purple-700">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
