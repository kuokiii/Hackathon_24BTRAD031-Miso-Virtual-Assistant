"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Mic, MicOff, Volume2, VolumeX, Sun, Moon, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useSpeechRecognition } from "@/lib/hooks/use-speech-recognition"
import { useTextToSpeech } from "@/lib/hooks/use-text-to-speech"
import { toast } from "@/hooks/use-toast"
import MessageBubble from "./message-bubble"
import TypingIndicator from "./typing-indicator"
import CherryBlossomIcon from "./cherry-blossom-icon"
import SettingsDialog from "./settings-dialog"
import ConversationExport from "./conversation-export"
import SuggestionChips from "./suggestion-chips"

// Add import for the MisoService
import { misoService } from "@/lib/services/miso-service"
import WeatherDisplay from "./weather-display"
import NewsDisplay from "./news-display"
import HomeControls from "./home-controls"

export type Message = {
  id: string
  content: string
  role: "assistant" | "user"
  timestamp: Date
}

export default function MisoAssistant() {
  // State for messages and input
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm Miso, your smart virtual assistant. How can I help you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Add state for special command results
  const [specialCommandResult, setSpecialCommandResult] = useState<{
    type: string
    data: any
  } | null>(null)

  // Settings state
  const [voiceSettings, setVoiceSettings] = useState({
    enabled: true,
    volume: 80,
    rate: 1,
    pitch: 1,
    voice: "female_default",
  })

  const [themeSettings, setThemeSettings] = useState({
    darkMode: false,
    accentColor: "pink",
  })

  const [modelSettings, setModelSettings] = useState({
    model: "google/gemini-2.0-pro-exp-02-05:free",
    temperature: 0.7,
    systemPrompt:
      "You are Miso, a helpful and friendly AI assistant with a cheerful personality. You provide concise, accurate, and helpful responses. You can help with smart home control, weather information, and news updates. When users ask about controlling home devices, weather, or news, you'll try to provide the most relevant information. For smart home requests, you can control lights, thermostats, switches, and media players. For weather requests, you can provide current conditions and forecasts. For news requests, you can provide headlines and search for specific topics.",
  })

  // Hooks
  const { transcript, isListening, startListening, stopListening } = useSpeechRecognition()
  const { speak, stop: stopSpeaking } = useTextToSpeech()

  // Update input when transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(transcript)
    }
  }, [transcript])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Toggle dark mode
  useEffect(() => {
    if (themeSettings.darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [themeSettings.darkMode])

  // Update CSS variables for accent color
  useEffect(() => {
    const root = document.documentElement

    switch (themeSettings.accentColor) {
      case "pink":
        root.style.setProperty("--primary", "335 80% 65%")
        break
      case "purple":
        root.style.setProperty("--primary", "262 83% 58%")
        break
      case "blue":
        root.style.setProperty("--primary", "210 100% 50%")
        break
      case "green":
        root.style.setProperty("--primary", "142 71% 45%")
        break
      case "orange":
        root.style.setProperty("--primary", "24 100% 50%")
        break
      default:
        root.style.setProperty("--primary", "335 80% 65%")
    }
  }, [themeSettings.accentColor])

  const toggleMicrophone = () => {
    if (isListening) {
      stopListening()
    } else {
      setInput("")
      startListening()
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsProcessing(true)

    // Reset special command result
    setSpecialCommandResult(null)

    try {
      // Check if this is a special command
      const specialCommand = await misoService.processMessage(userMessage.content)

      if (specialCommand.isSpecialCommand && specialCommand.response) {
        // Handle special command
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: specialCommand.response,
          role: "assistant",
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])

        // Set special command result if we have data
        if (specialCommand.data && specialCommand.commandType) {
          setSpecialCommandResult({
            type: specialCommand.commandType,
            data: specialCommand.data,
          })
        }

        // Speak the response if voice is enabled
        if (voiceSettings.enabled) {
          speak(specialCommand.response, voiceSettings.rate, voiceSettings.pitch, voiceSettings.voice)
        }
      } else {
        // Call our API route for regular AI processing
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            model: modelSettings.model,
            temperature: modelSettings.temperature,
            systemPrompt: modelSettings.systemPrompt,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to generate response")
        }

        const data = await response.json()
        const responseText = data.content

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: responseText,
          role: "assistant",
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])

        // Speak the response if voice is enabled
        if (voiceSettings.enabled) {
          speak(responseText, voiceSettings.rate, voiceSettings.pitch, voiceSettings.voice)
        }
      }
    } catch (error) {
      console.error("Error generating response:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate response",
        variant: "destructive",
      })

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I encountered an error while processing your request. Please try again later.",
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleClearConversation = () => {
    setMessages([
      {
        id: Date.now().toString(),
        content: "Hello! I'm Miso, your smart virtual assistant. How can I help you today?",
        role: "assistant",
        timestamp: new Date(),
      },
    ])
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
  }

  return (
    <Card
      className={cn(
        "w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden shadow-lg transition-all duration-300",
        "border-primary/20 backdrop-blur-sm bg-background/80",
        "rounded-3xl",
        themeSettings.darkMode ? "dark" : "",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <CherryBlossomIcon className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-pink-400 bg-clip-text text-transparent">
            Miso Assistant
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setThemeSettings({ ...themeSettings, darkMode: !themeSettings.darkMode })}
            className="rounded-full hover:bg-primary/10 hover:text-primary"
          >
            {themeSettings.darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVoiceSettings({ ...voiceSettings, enabled: !voiceSettings.enabled })}
            className={cn(
              "rounded-full hover:bg-primary/10 hover:text-primary",
              !voiceSettings.enabled && "text-muted-foreground",
            )}
          >
            {voiceSettings.enabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
          <SettingsDialog
            voiceSettings={voiceSettings}
            setVoiceSettings={setVoiceSettings}
            themeSettings={themeSettings}
            setThemeSettings={setThemeSettings}
            modelSettings={modelSettings}
            setModelSettings={setModelSettings}
          />
          <ConversationExport messages={messages} onClearConversation={handleClearConversation} />
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <MessageBubble message={message} />
              </motion.div>
            ))}
          </AnimatePresence>

          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CherryBlossomIcon className="w-4 h-4 text-primary" />
                </div>
                <TypingIndicator />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion chips */}
        {messages.length <= 2 && !isProcessing && <SuggestionChips onSuggestionClick={handleSuggestionClick} />}
      </ScrollArea>

      {/* Special Command Results */}
      {specialCommandResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="px-4 mb-4"
        >
          {specialCommandResult.type === "weather" && specialCommandResult.data && (
            <WeatherDisplay
              location={specialCommandResult.data.weather?.location || specialCommandResult.data.location || "New York"}
              weatherData={
                specialCommandResult.data.weather ||
                specialCommandResult.data || {
                  temperature: 22,
                  description: "Partly Cloudy",
                  windSpeed: 5,
                  feels_like: 20,
                  humidity: 45,
                }
              }
              forecastData={specialCommandResult.data.forecast}
              setSpecialCommandResult={() => setSpecialCommandResult(null)}
            />
          )}

          {specialCommandResult.type === "news" && specialCommandResult.data && specialCommandResult.data.articles && (
            <NewsDisplay
              articles={specialCommandResult.data.articles}
              category={specialCommandResult.data.category}
              searchQuery={specialCommandResult.data.searchQuery}
              onClose={() => setSpecialCommandResult(null)}
            />
          )}

          {specialCommandResult.type === "home" && <HomeControls onClose={() => setSpecialCommandResult(null)} />}
        </motion.div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-primary/10">
        <div className="flex items-end gap-2">
          <Button
            variant={isListening ? "default" : "outline"}
            size="icon"
            onClick={toggleMicrophone}
            className={cn(
              "rounded-full transition-all duration-300",
              isListening ? "bg-pink-500 hover:bg-pink-600 animate-pulse" : "hover:bg-primary/10 hover:text-primary",
            )}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : "Type a message..."}
            className="min-h-[50px] max-h-[150px] rounded-xl resize-none border-primary/20 focus-visible:ring-primary/30"
            disabled={isListening}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isProcessing}
            className="rounded-full h-10 w-10 p-0 bg-primary hover:bg-primary/90"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

